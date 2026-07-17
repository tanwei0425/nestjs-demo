import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { AllConfigType } from '@/config/config.types';

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
        const nodeEnv = configService.getOrThrow<string>('app.nodeEnv', {
          infer: true,
        });
        const level = configService.getOrThrow('logger.level', {
          infer: true,
        });
        const pretty = configService.getOrThrow('logger.pretty', {
          infer: true,
        });
        const fileEnabled = configService.getOrThrow('logger.fileEnabled', {
          infer: true,
        });
        const logDir = configService.getOrThrow('logger.dir', {
          infer: true,
        });
        const rotationStrategy = configService.getOrThrow(
          'logger.rotationStrategy',
          { infer: true },
        );
        const maxSizeMB = configService.getOrThrow('logger.maxSizeMB', {
          infer: true,
        });
        const requestIdSource = configService.getOrThrow(
          'logger.requestIdSource',
          { infer: true },
        );

        /**
         * 构建 pino transport
         * 终端输出 + 可选的文件输出
         */
        const targets: Array<{
          target: string;
          level?: string;
          options: Record<string, unknown>;
        }> = [];

        // 终端输出
        if (pretty) {
          targets.push({
            target: 'pino-pretty',
            level,
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
              messageFormat: '[{req.id}] {msg}',
            },
          });
        } else {
          // 生产环境终端也输出 JSON（被容器日志采集）
          targets.push({
            target: 'pino/file',
            level,
            options: { destination: 1 }, // stdout
          });
        }

        // 文件输出
        if (fileEnabled) {
          const rollBaseOptions = {
            extension: '.log',
            dateFormat: 'yyyy-MM-dd',
            size: `${maxSizeMB}m`,
            mkdir: true,
          };

          // 全量日志文件
          targets.push({
            target: 'pino-roll',
            level,
            options: {
              file: join(logDir, 'app'),
              ...(rotationStrategy === 'daily' ? { frequency: 'daily' } : {}),
              ...rollBaseOptions,
            },
          });

          // error 级别独立日志文件，方便快速定位错误
          targets.push({
            target: 'pino-roll',
            level: 'error',
            options: {
              file: join(logDir, 'error'),
              ...(rotationStrategy === 'daily' ? { frequency: 'daily' } : {}),
              ...rollBaseOptions,
            },
          });
        }

        /**
         * pino-http 配置
         */
        return {
          pinoHttp: {
            level,
            transport: targets.length > 0 ? { targets } : undefined,
            assignResponse: true,

            /**
             * 自动 HTTP 请求日志
             * 例如：GET /user/list 200 20ms
             */
            autoLogging: {
              ignore: (req) => {
                const url = req.url ?? '';
                return url.startsWith('/health') || url.startsWith('/metrics');
              },
            },

            /**
             * 每个请求生成唯一 ID，全链路追踪
             */
            genReqId: (req) => {
              // 优先从请求头获取（支持网关/负载均衡器传入）
              if (requestIdSource === 'header') {
                const headerId =
                  req.headers?.['x-request-id'] ||
                  req.headers?.['X-Request-ID'];
                if (typeof headerId === 'string' && headerId) {
                  return headerId;
                }
              }
              return randomUUID();
            },

            /**
             * 敏感信息脱敏
             */
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

            /**
             * 自定义基础信息，每条日志都会带
             */
            base: {
              service: configService.getOrThrow<string>('app.appName', {
                infer: true,
              }),
              env: nodeEnv,
            },
          },
        };
      },
    }),
  ],

  exports: [PinoLoggerModule],
})
export class LoggerModule {}
