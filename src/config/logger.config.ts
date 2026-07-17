/**
 * Logger 配置
 *
 * 统一管理日志相关配置，支持企业级日志方案
 */

import { registerAs } from '@nestjs/config';
import type { LoggerConfig } from './config.types';
import { join } from 'node:path';

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

/**
 * 判断日志保留策略是否合法
 */
function isLogKeepStrategy(
  value: string | undefined,
): value is '7d' | '14d' | '30d' | '90d' {
  return ['7d', '14d', '30d', '90d'].includes(value ?? '');
}

export default registerAs<LoggerConfig>('logger', (): LoggerConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    // ========== 基础配置 ==========
    /**
     * 日志等级
     * 优先使用 LOG_LEVEL 环境变量
     * 默认：production -> info, 其他 -> trace
     */
    level: isLoggerLevel(process.env.LOG_LEVEL)
      ? process.env.LOG_LEVEL
      : nodeEnv === 'production'
        ? 'info'
        : 'trace',

    /**
     * 是否开启美化输出（终端彩色）
     * 优先使用 LOG_PRETTY 环境变量
     * 默认：非生产环境开启
     */
    pretty:
      process.env.LOG_PRETTY === undefined
        ? nodeEnv !== 'production'
        : process.env.LOG_PRETTY === 'true',

    // ========== 文件日志配置 ==========
    /**
     * 日志文件目录
     * 默认：项目根目录 logs/
     */
    dir: process.env.LOG_DIR ?? join(process.cwd(), 'logs'),

    /**
     * 是否输出到文件
     * 默认：测试和生产环境输出到文件
     */
    fileEnabled:
      process.env.LOG_FILE_ENABLED === undefined
        ? nodeEnv !== 'development'
        : process.env.LOG_FILE_ENABLED === 'true',

    /**
     * 单个日志文件最大大小（MB）
     * 超过大小时自动分割新文件
     * 同时按天轮转
     * 推荐：10MB（约 10 万条日志）
     */
    maxSizeMB: Number(process.env.LOG_MAX_SIZE_MB) || 10,

    /**
     * 日志保留时间
     * 用于日志清理任务，配合 cron job 使用
     */
    keep: isLogKeepStrategy(process.env.LOG_KEEP)
      ? process.env.LOG_KEEP
      : '30d',

    // ========== 高级配置 ==========
    /**
     * 是否输出堆栈跟踪
     * 生产环境建议关闭，避免敏感信息泄露
     */
    stackTrace: process.env.LOG_STACK_TRACE === 'true',

    /**
     * 请求 ID 来源
     * header: 从 X-Request-ID 请求头获取
     * uuid: 自动生成 UUID
     */
    requestIdSource:
      (process.env.LOG_REQUEST_ID_SOURCE as 'header' | 'uuid') ?? 'uuid',
  };
});
