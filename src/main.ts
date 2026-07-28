import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { AllConfigType } from './config/config.types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // 默认为 true，表示将所有日志写入缓存，而不是立即写入。
    // logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  // 获取 Pino Logger
  const logger = app.get(Logger);
  // Pino Logger 绑定到 NestJS 中, 替换 Nest 默认 Logger
  app.useLogger(logger);
  // 把缓存日志交给新 Logger
  app.flushLogs();
  // 允许所有来源（生产环境可换成具体的域名白名单）
  // app.enableCors({
  //   origin: true, // 或 ['http://localhost:3001', 'https://your-domain.com']
  //   credentials: true,
  // });
  const configService = app.get<ConfigService<AllConfigType>>(ConfigService);
  const appName = configService.getOrThrow<string>('app.appName', {
    infer: true,
  });
  const appVersion = configService.getOrThrow<string>('app.version', {
    infer: true,
  });
  const appApiPrefix = configService.getOrThrow<string>('app.apiPrefix', {
    infer: true,
  });
  const appPort = configService.getOrThrow('app.port', { infer: true });
  const swaggerPath = configService.getOrThrow<string>('app.swaggerPath', {
    infer: true,
  });
  // 为所有 API 统一添加全局前缀
  // 注意：exclude 不能包含 '/'，否则 NestJS 中间件注册时
  // 会触发根路径检查，导致 pino-http 中间件只注册到 '/' 而非所有路由
  app.setGlobalPrefix(appApiPrefix, {
    exclude: [
      'health', // 排除健康检查接口
      'metrics', // 排除指标接口
      swaggerPath, // 排除 Swagger 页面入口
      `${swaggerPath}-json`, // 排除 Swagger 静态资源
    ],
  });
  // 设置swagger文档(/docs访问)
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName}管理后台`) // 文档标题
    .setDescription(`${appName}管理后台接口文档`) // 文档描述
    .setVersion(appVersion) // API版本
    .addBearerAuth() // JWT Bearer Token，Swagger 页面会出现 Authorize
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  // 注册全局管道（Pipe），让所有接口请求在进入 Controller 前统一进行参数校验、转换和数据处理。
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除 DTO 中没有声明的字段。
      transform: true, // 自动把请求参数转换成 DTO 定义的类型。
      forbidNonWhitelisted: true, // 发现未知字段直接报错
    }),
  );
  // 设置全局路由前缀
  await app.listen(appPort);
  logger.log(`🚀 ${appName} started on port ${appPort}`);
}
void bootstrap();
