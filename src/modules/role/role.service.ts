import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
  /**
   * 测试
   * @returns
   */
  getList(): string {
    return 'getList!';
  }
}
