import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AllConfigType } from '@/config/config.types';

/**
 * 全局 Logger 模块
 *
 * 设计目标：
 * 1. 整个应用统一日志出口
 * 2. 开发环境方便阅读
 * 3. 生产环境输出 JSON 给日志系统采集
 * 4. 所有配置来自 ConfigService
 * 5. 不直接读取 process.env
 *
 * 使用：
 * Controller:
 * constructor(
 *   private readonly logger: PinoLogger,
 * ) {}
 * this.logger.info('xxx');
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      /**
       * 动态创建 pino 配置，Nest 启动时执行一次，可以根据环境生成不同 Logger
       */
      useFactory: (configService: ConfigService<AllConfigType>) => {
        console.log('Pino Factory');
        /**
         * 获取当前环境
         */
        const nodeEnv = configService.getOrThrow<string>('app.nodeEnv', {
          infer: true,
        });

        /**
         * 开发：trace
         * 生产：info
         */
        const level = configService.getOrThrow('logger.level', {
          infer: true,
        });
        /**
         * 是否生产环境
         */
        const pretty = configService.getOrThrow('logger.pretty', {
          infer: true,
        });

        /**
         * 开发环境日志格式化
         * 开发：target:pino-pretty
         * 生产：undefined，输出 JSON，方便 ELK/Loki 收集
         */
        const transport = pretty
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true, // 终端颜色
                singleLine: true, // 单行显示，比较适合开发终端
                translateTime: 'SYS:standard', // 时间格式
                ignore: 'pid,hostname', // 忽略无意义字段
                messageFormat: '[{req.id}] {msg}',
              },
            }
          : undefined;
        return {
          pinoHttp: {
            // 日志等级
            level,

            // 开发环境格式化
            transport,
            assignResponse: true,
            /**
             * 自动 HTTP 请求日志
             * 例如：
             * GET /user/list 200 20ms
             * Nest Controller 不需要手动打印
             */
            autoLogging: {
              /**
               * 忽略健康检查
               * 因为 k8s 会频繁访问
               */
              ignore: (req) => {
                const url = req.url ?? '';
                return url.startsWith('/health') || url.startsWith('/metrics');
              },
            },

            /**
             * 每个请求生成唯一 ID
             * 作用：用户请求，全链路关联：Controller、Service、Exception，
             */
            genReqId: (req) => {
              const id = randomUUID();
              console.log('genReqId =>', id, 'url:', req?.url);
              return id;
            },

            /**
             * 敏感信息脱敏
             * 防止：JWT、Cookie、泄漏到日志
             */
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers.x-api-key',
                'req.body.password',
                'req.body.token',
              ],
              // 替换内容，不删除字段
              censor: '******',
            },

            /**
             * 自定义基础信息，每条日志都会带
             */
            base: {
              /**
               * 服务名称，方便日志平台搜索
               */
              service: configService.getOrThrow<string>('app.appName', {
                infer: true,
              }),

              /**
               * 当前环境
               */
              env: nodeEnv,
            },
          },
        };
      },
    }),
  ],

  /**
   * 导出
   * 其它模块可以注入 PinoLogger
   */
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
