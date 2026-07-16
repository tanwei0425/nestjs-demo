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
