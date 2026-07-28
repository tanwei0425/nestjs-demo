/**
 * App Config
 */
import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.types';

// https://github.com/brocoders/nestjs-boilerplate/blob/main/src/config/config.type.ts
export default registerAs<AppConfig>('app', (): AppConfig => {
  return {
    appName: process.env.APP_NAME ?? 'NestJS API',
    version: process.env.APP_VERSION ?? '1.0.0',
    nodeEnv: (process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'],
    port: Number(process.env.APP_PORT ?? process.env.PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  };
});
