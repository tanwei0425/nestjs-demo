/**
 * Logger 配置
 *
 * 统一管理日志相关配置
 */

import { registerAs } from '@nestjs/config';
import type { LoggerConfig } from './config.types';

/**
 * 判断日志等级是否合法
 */
function isLoggerLevel(
  value: string | undefined,
): value is LoggerConfig['level'] {
  return (
    value === 'trace' ||
    value === 'debug' ||
    value === 'info' ||
    value === 'warn' ||
    value === 'error' ||
    value === 'fatal'
  );
}

export default registerAs<LoggerConfig>('logger', (): LoggerConfig => {
  /**
   * 当前运行环境
   */
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  /**
   * 环境变量 LOG_LEVEL
   * 例如：LOG_LEVEL=debug
   */
  const logLevel = process.env.LOG_LEVEL;

  /**
   * 环境变量 LOG_PRETTY
   * 例如：LOG_PRETTY=true
   */
  const logPretty = process.env.LOG_PRETTY;

  return {
    /**
     * 日志等级
     * 优先使用 LOG_LEVEL
     * 没配置：
     * production  -> info
     * development -> trace
     */
    level: isLoggerLevel(logLevel)
      ? logLevel
      : nodeEnv === 'production'
        ? 'info'
        : 'trace',

    /**
     * 是否开启美化输出
     * 优先使用 LOG_PRETTY
     * 没配置：
     * production  -> false
     * development -> true
     */
    pretty:
      logPretty === undefined ? nodeEnv !== 'production' : logPretty === 'true',
  };
});
