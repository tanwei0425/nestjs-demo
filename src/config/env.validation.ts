/**
 * Environment variables validation
 */
import Joi from 'joi';
export const envValidationSchema = Joi.object({
  /**
   * 应用环境
   */
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().required(),
  APP_VERSION: Joi.string().default('1.0.0'),
  API_PREFIX: Joi.string().default('api'),
  APP_PORT: Joi.number().integer().min(1).max(65535).default(3000),
  PORT: Joi.number().integer().min(1).max(65535),

  /**
   * Pino日志配置
   */
  // 日志等级
  LOG_LEVEL: Joi.string().valid(
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
  ),
  // 是否美化输出
  LOG_PRETTY: Joi.boolean()
    .truthy('true', 'TRUE', '1')
    .falsy('false', 'FALSE', '0'),
  // 是否输出到文件
  LOG_FILE_ENABLED: Joi.boolean()
    .truthy('true', 'TRUE', '1')
    .falsy('false', 'FALSE', '0'),
  // 日志文件目录
  LOG_DIR: Joi.string(),
  // 日志轮转策略
  LOG_ROTATION_STRATEGY: Joi.string().valid('daily', 'size'),
  // 单个日志文件最大大小（MB）
  LOG_MAX_SIZE_MB: Joi.number().integer().min(1).max(1000).default(10),
  // 日志保留时间
  LOG_KEEP: Joi.string().valid('7d', '14d', '30d', '90d'),
  // 请求 ID 来源
  LOG_REQUEST_ID_SOURCE: Joi.string().valid('header', 'uuid'),

  /**
   * 数据库配置
   */
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().integer().min(1).max(65535).default(3306),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().allow('').required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SYNCHRONIZE: Joi.boolean()
    .truthy('true', 'TRUE', '1')
    .falsy('false', 'FALSE', '0')
    .default(false),
  DATABASE_MAX_CONNECTIONS: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100),
});
// .unknown(false); // 禁止环境变量中出现没有定义过的字段;
