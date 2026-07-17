import { Controller, Get } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly userService: UserService,
  ) {}

  @Get('list')
  getList() {
    this.pinoLogger.info('list 请求成功');
    return this.userService.getList();
  }
}
