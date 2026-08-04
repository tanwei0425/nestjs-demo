import { Controller, Get } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
@ApiTags('角色管理')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  @Get('list')
  @ApiOperation({
    summary: '获取角色列表', // 简短的标题，会直接显示在接口路径旁边
    description: '分页获取所有角色信息', // 详细描述，折叠在内部
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
  getList() {
    return this.roleService.getList();
  }
}
