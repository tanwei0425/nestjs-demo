import { Controller, Get, Query } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly userService: UserService,
  ) {}
  @Get('list')
  @ApiOperation({
    summary: '获取用户列表', // 简短的标题，会直接显示在接口路径旁边
    description: '分页获取所有用户信息', // 详细描述，折叠在内部
  })
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
    description: '页码，默认 1',
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    type: Number,
    description: '每页条数，默认 10',
  })
  // @ApiOkResponse({ description: '成功', type: RoleListResponseDto })
  getList(@Query('page') page?: number, @Query('limit') limit?: number) {
    this.pinoLogger.info(`${page}, ${limit} user list 参数`);
    return this.userService.getList();
  }
}
