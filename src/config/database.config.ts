/**
 * @description: 数据库配置
 */
import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './config.types';

export default registerAs<DatabaseConfig>('database', (): DatabaseConfig => {
  return {
    type: 'mysql',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 3306),
    username: process.env.DATABASE_USERNAME ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    name: process.env.DATABASE_NAME ?? 'nestjs',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    maxConnections: Number(process.env.DATABASE_MAX_CONNECTIONS ?? 100),
  };
});
