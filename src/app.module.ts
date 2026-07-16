import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@/core/logger/logger.module';
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import loggerConfig from '@/config/logger.config';
import { envValidationSchema } from '@/config/env.validation';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      cache: true, // 缓存配置，提高读取效率
      expandVariables: true, // 支持变量引用
      load: [appConfig, databaseConfig, loggerConfig], // 注册配置工厂
      // load: [appConfig, databaseConfig, redisConfig, jwtConfig]
      // 环境变量运行校验
      validationSchema: envValidationSchema,
    }),
    LoggerModule,
    UserModule,
  ],
})
export class AppModule {}
