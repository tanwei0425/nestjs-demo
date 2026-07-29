import { Controller, Get } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
@ApiTags('角色管理')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  @Get('list')
  @ApiOperation({
    summary: '获取角色列表', // 简短的标题，会直接显示在接口路径旁边
    description: '分页获取所有角色信息', // 详细描述，折叠在内部
  })
  getList() {
    return this.roleService.getList();
  }
}
