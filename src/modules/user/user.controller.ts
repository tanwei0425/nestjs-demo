import { Controller, Get } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.types';

@Controller('user')
export class UserController {
  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly userService: UserService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}
  @Get('list')
  getList() {
    this.pinoLogger.info(
      `pinoLogger：list 请求成功，${this.configService.getOrThrow('app.appName', { infer: true })}`,
    );
    return this.userService.getList();
  }
}
