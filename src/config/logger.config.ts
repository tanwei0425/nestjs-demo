/**
 * Logger 配置
 *
 * 统一管理日志相关配置，支持企业级日志方案
 */

import { registerAs } from '@nestjs/config';
import type { LoggerConfig } from './config.types';
import { join } from 'node:path';

/**
 * 合法日志等级集合
 */
const LOGGER_LEVELS: ReadonlySet<string> = new Set([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

/**
 * 合法轮转策略集合
 */
const ROTATION_STRATEGIES: ReadonlySet<string> = new Set(['daily', 'size']);

/**
 * 合法日志保留策略集合
 */
const LOG_KEEP_STRATEGIES: ReadonlySet<string> = new Set([
  '7d',
  '14d',
  '30d',
  '90d',
]);

/**
 * 合法请求 ID 来源集合
 */
const REQUEST_ID_SOURCES: ReadonlySet<string> = new Set(['header', 'uuid']);

export default registerAs<LoggerConfig>('logger', (): LoggerConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProd = nodeEnv === 'production';

  return {
    // ========== 基础配置 ==========
    level: LOGGER_LEVELS.has(process.env.LOG_LEVEL ?? '')
      ? (process.env.LOG_LEVEL as LoggerConfig['level'])
      : isProd
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

    rotationStrategy: ROTATION_STRATEGIES.has(
      process.env.LOG_ROTATION_STRATEGY ?? '',
    )
      ? (process.env.LOG_ROTATION_STRATEGY as 'daily' | 'size')
      : isProd
        ? 'size'
        : 'daily',

    maxSizeMB: Number(process.env.LOG_MAX_SIZE_MB) || 10,

    keep: LOG_KEEP_STRATEGIES.has(process.env.LOG_KEEP ?? '')
      ? (process.env.LOG_KEEP as LoggerConfig['keep'])
      : '30d',

    // ========== 高级配置 ==========
    stackTrace: process.env.LOG_STACK_TRACE === 'true',

    requestIdSource: REQUEST_ID_SOURCES.has(
      process.env.LOG_REQUEST_ID_SOURCE ?? '',
    )
      ? (process.env.LOG_REQUEST_ID_SOURCE as 'header' | 'uuid')
      : 'uuid',
  };
});
