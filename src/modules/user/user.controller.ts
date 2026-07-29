import { Controller, Get } from '@nestjs/common';
// import { PinoLogger } from 'nestjs-pino';
import { UserService } from './user.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(
    // private readonly pinoLogger: PinoLogger,
    private readonly userService: UserService,
  ) {}
  @Get('list')
  @ApiOperation({
    summary: '获取用户列表', // 简短的标题，会直接显示在接口路径旁边
    description: '分页获取所有用户信息', // 详细描述，折叠在内部
  })
  getList() {
    // this.pinoLogger.info('user list 请求成功');
    return this.userService.getList();
  }
}
