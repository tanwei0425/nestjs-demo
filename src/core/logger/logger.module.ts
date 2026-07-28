import { Global, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { AllConfigType, LoggerConfig } from '@/config/config.types';

/**
 * 全局 Logger 模块
 *
 * 设计目标：
 * 1. 整个应用统一日志出口
 * 2. 开发环境方便阅读（pino-pretty 彩色输出）
 * 3. 生产环境输出 JSON 给日志系统采集（ELK/Loki）
 * 4. 支持文件输出，可选按天或按大小轮转
 * 5. 每个请求自动生成唯一 ID，全链路追踪
 * 6. 所有配置来自 ConfigService，不直接读取 process.env
 *
 * 使用：
 * Controller / Service:
 * constructor(private readonly logger: PinoLogger) {}
 * this.logger.info('xxx');
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService<AllConfigType>) => {
        const loggerConfig = configService.getOrThrow('logger', {
          infer: true,
        });
        const appName = configService.getOrThrow<string>('app.appName', {
          infer: true,
        });
        const nodeEnv = configService.getOrThrow<string>('app.nodeEnv', {
          infer: true,
        });

        const targets = buildTargets(loggerConfig);

        return {
          pinoHttp: {
            level: loggerConfig.level,
            transport: targets.length > 0 ? { targets } : undefined,
            assignResponse: true,
            autoLogging: {
              ignore: (req) => {
                const url = req.url ?? '';
                return url.startsWith('/health') || url.startsWith('/metrics');
              },
            },
            genReqId: buildGenReqId(loggerConfig.requestIdSource),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers.x-api-key',
                'req.body.password',
                'req.body.token',
              ],
              censor: '******',
            },
            base: {
              service: appName,
              env: nodeEnv,
            },
          },
          // Express 5 要求命名参数语法：*path（而非 *）
          forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
        };
      },
    }),
  ],

  exports: [PinoLoggerModule],
})
export class LoggerModule {}

/**
 * pino transport target 类型
 */
type PinoTarget = {
  target: string;
  level?: string;
  options: Record<string, unknown>;
};

/**
 * 构建所有日志输出目标
 * 终端输出 + 可选的文件输出
 */
function buildTargets(config: LoggerConfig): PinoTarget[] {
  const targets: PinoTarget[] = [];

  // 终端输出
  targets.push(buildConsoleTarget(config));

  // 文件输出
  if (config.fileEnabled) {
    targets.push(buildRollTarget(config, 'app', config.level));
    targets.push(buildRollTarget(config, 'error', 'error'));
  }

  return targets;
}

/**
 * 构建终端输出目标
 * - 开发环境：pino-pretty 彩色输出
 * - 生产环境：pino/file 输出 JSON 到 stdout
 */
function buildConsoleTarget(config: LoggerConfig): PinoTarget {
  if (config.pretty) {
    return {
      target: 'pino-pretty',
      level: config.level,
      options: {
        colorize: true,
        singleLine: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '[{req.id}] {msg}',
      },
    };
  }

  return {
    target: 'pino/file',
    level: config.level,
    options: { destination: 1 }, // stdout
  };
}

/**
 * 构建 pino-roll 文件输出目标
 *
 * @param config    日志配置
 * @param filePrefix 文件名前缀（app / error）
 * @param level      该目标的日志级别
 */
function buildRollTarget(
  config: LoggerConfig,
  filePrefix: string,
  level: string,
): PinoTarget {
  const options: Record<string, unknown> = {
    file: join(config.dir, filePrefix),
    extension: '.log',
    dateFormat: 'yyyy-MM-dd',
    size: `${config.maxSizeMB}m`,
    mkdir: true,
    // 日志文件保留数量，从 keep 配置（如 '30d'）中提取天数
    limit: { count: parseInt(config.keep, 10) || 30 },
  };

  // daily 策略额外启用按天轮转
  if (config.rotationStrategy === 'daily') {
    options.frequency = 'daily';
  }

  return {
    target: 'pino-roll',
    level,
    options,
  };
}

/**
 * 构建 genReqId 函数
 * 优先从请求头获取（支持网关/负载均衡器传入），否则生成 UUID
 */
function buildGenReqId(source: LoggerConfig['requestIdSource']) {
  return (req: { headers?: Record<string, unknown> }) => {
    if (source === 'header') {
      const headerId =
        req.headers?.['x-request-id'] || req.headers?.['X-Request-ID'];
      if (typeof headerId === 'string' && headerId) {
        return headerId;
      }
    }
    return randomUUID();
  };
}
