/**
 * 应用配置
 */
export type AppConfig = {
  appName: string;
  version: string;
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  apiPrefix: string;
};
/**
 * 数据库配置
 */
export type DatabaseConfig = {
  // type: 'mysql' | 'postgres';
  type: 'mysql';
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  maxConnections: number;
};
/**
 * Pino日志配置
 */
export type LoggerConfig = {
  // ========== 基础配置 ==========
  /**
   * 日志等级
   * trace、debug、info、warn、error、fatal
   */
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  /**
   * 是否开启美化输出
   * 开发环境 true，生产环境 false
   */
  pretty: boolean;

  // ========== 文件日志配置 ==========
  /**
   * 日志文件目录
   */
  dir: string;

  /**
   * 是否输出到文件
   */
  fileEnabled: boolean;

  /**
   * 日志轮转策略
   * daily: 按天轮转，每天一个文件
   * size: 按大小轮转，超过 maxSizeMB 时自动分割
   */
  rotationStrategy: 'daily' | 'size';

  /**
   * 单个日志文件最大大小（MB）
   * 仅 rotationStrategy=size 时生效
   */
  maxSizeMB: number;

  /**
   * 日志保留时间
   */
  keep: '7d' | '14d' | '30d' | '90d';

  // ========== 高级配置 ==========
  /**
   * 是否输出堆栈跟踪
   */
  stackTrace: boolean;

  /**
   * 请求 ID 来源
   */
  requestIdSource: 'header' | 'uuid';
};

/**
 * 全部配置类型
 */
export type AllConfigType = {
  // 应用配置
  app: AppConfig;
  // 数据库配置
  database: DatabaseConfig;
  // Pino日志配置
  logger: LoggerConfig;
};
