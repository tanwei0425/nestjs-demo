import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import pinoPretty from 'pino-pretty';
import { multistream, type StreamEntry, type DestinationStream } from 'pino';
import { createStream } from 'rotating-file-stream';
import { AllConfigType } from '@/config/config.types';

/**
 * 全局 Logger 模块
 *
 * 设计目标：
 * 1. 整个应用统一日志出口
 * 2. 开发环境：终端彩色输出，方便本地调试
 * 3. 生产环境：结构化 JSON 写入文件，配合日志采集系统（ELK/Loki）
 * 4. 测试环境：终端 + 文件双重输出，兼顾调试和留痕
 * 5. 所有配置来自 ConfigService，不直接读取 process.env
 * 6. 文件日志：按天轮转，超过 maxSizeMB 时自动分割
 * 7. 请求 ID 自动注入：手动日志也会携带 reqId
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
        const appName = configService.getOrThrow<string>('app.appName', {
          infer: true,
        });
        const loggerConfig = configService.getOrThrow('logger', {
          infer: true,
        });

        const { level, pretty, dir, fileEnabled, maxSizeMB, requestIdSource } =
          loggerConfig;

        /**
         * 构建 stream 配置
         * 使用 rotating-file-stream 实现：按天轮转 + 超过大小时自动分割
         */
        const streams = buildStreams({
          pretty,
          fileEnabled,
          logDir: dir,
          maxSizeMB,
        });

        return {
          pinoHttp: {
            // 日志等级
            level,

            // 多输出流
            stream: streams,

            // 自动 HTTP 请求日志
            autoLogging: {
              // 忽略健康检查和监控接口，避免 k8s 探针刷屏
              ignore: (req) => {
                const url = req.url ?? '';
                return url.startsWith('/health') || url.startsWith('/metrics');
              },
            },

            // 每个请求生成唯一 ID，用于全链路追踪
            genReqId: (req) => {
              // 优先使用请求头中的 X-Request-ID
              const headerId = req.headers['x-request-id'] as string;
              if (requestIdSource === 'header' && headerId) {
                return headerId;
              }
              return randomUUID();
            },

            // 请求日志自定义序列化：精简 req/res 输出
            serializers: {
              req: (req: Record<string, unknown>) => {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                };
              },
              res: (res: Record<string, unknown>) => {
                return {
                  statusCode: res.statusCode,
                };
              },
            },

            // 敏感信息脱敏
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

            // 每条日志携带的基础信息
            base: {
              service: appName,
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

/**
 * 构建日志输出流
 *
 * rotating-file-stream 特性：
 * - interval: '1d' 每天轮转
 * - size: '10M' 超过 10MB 时自动分割
 * - 文件名格式：app-2026-07-16.log, app-2026-07-16.1.log
 */
function buildStreams(options: {
  pretty: boolean;
  fileEnabled: boolean;
  logDir: string;
  maxSizeMB: number;
}): DestinationStream {
  const { pretty, fileEnabled, logDir, maxSizeMB } = options;

  // 仅终端输出（开发环境）
  if (!fileEnabled) {
    return pinoPretty({
      colorize: true,
      singleLine: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '[{req.id}] {msg}',
    });
  }

  const streams: StreamEntry[] = [];

  // 终端输出（测试环境）
  if (pretty) {
    streams.push({
      stream: pinoPretty({
        colorize: true,
        singleLine: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: '[{req.id}] {msg}',
      }),
      level: 'debug',
    });
  }

  // 文件输出：app 日志（info 及以上）
  streams.push({
    stream: createRotatingFileStream({ logDir, maxSizeMB, prefix: 'app' }),
    level: 'info',
  });

  // 文件输出：error 日志（error 及以上）
  streams.push({
    stream: createRotatingFileStream({ logDir, maxSizeMB, prefix: 'error' }),
    level: 'error',
  });

  return multistream(streams);
}

/**
 * 创建 rotating-file-stream 流
 *
 * 文件命名规则：
 * - app-2026-07-16.log     当天第一个文件
 * - app-2026-07-16.1.log   超过 10MB 后的第二个文件
 * - app-2026-07-16.2.log   第三个文件...
 */
function createRotatingFileStream(options: {
  logDir: string;
  maxSizeMB: number;
  prefix: string;
}): NodeJS.WritableStream {
  const { logDir, maxSizeMB, prefix } = options;

  return createStream(
    // 文件名生成函数：prefix-YYYY-MM-DD.log 或 prefix-YYYY-MM-DD.N.log
    (time, index) => {
      const date = time
        ? new Date(time).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // index > 1 表示当天已经有分割文件
      if (index && index > 1) {
        return `${prefix}-${date}.${index - 1}.log`;
      }
      return `${prefix}-${date}.log`;
    },
    {
      path: logDir,
      size: `${maxSizeMB}M`, // 超过 maxSizeMB 时分割
      interval: '1d', // 每天轮转
      compress: false, // 不压缩（可根据需要开启 'gzip'）
    },
  );
}
