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
 * 判断日志轮转策略是否合法
 */
function isRotationStrategy(
  value: string | undefined,
): value is 'daily' | 'size' {
  return value === 'daily' || value === 'size';
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
    level: isLoggerLevel(process.env.LOG_LEVEL)
      ? process.env.LOG_LEVEL
      : nodeEnv === 'production'
        ? 'info'
        : 'trace',

    pretty:
      process.env.LOG_PRETTY === undefined
        ? nodeEnv !== 'production'
        : process.env.LOG_PRETTY === 'true',

    // ========== 文件日志配置 ==========
    dir: process.env.LOG_DIR ?? join(process.cwd(), 'logs'),

    fileEnabled:
      process.env.LOG_FILE_ENABLED === undefined
        ? nodeEnv !== 'development'
        : process.env.LOG_FILE_ENABLED === 'true',

    /**
     * 日志轮转策略
     * daily: 按天轮转，每天生成一个新文件
     * size: 按大小轮转，超过 maxSizeMB 时自动分割
     */
    rotationStrategy: isRotationStrategy(process.env.LOG_ROTATION_STRATEGY)
      ? process.env.LOG_ROTATION_STRATEGY
      : nodeEnv === 'production'
        ? 'size'
        : 'daily',

    maxSizeMB: Number(process.env.LOG_MAX_SIZE_MB) || 10,

    keep: isLogKeepStrategy(process.env.LOG_KEEP)
      ? process.env.LOG_KEEP
      : '30d',

    // ========== 高级配置 ==========
    stackTrace: process.env.LOG_STACK_TRACE === 'true',

    requestIdSource:
      (process.env.LOG_REQUEST_ID_SOURCE as 'header' | 'uuid') ?? 'uuid',
  };
});
