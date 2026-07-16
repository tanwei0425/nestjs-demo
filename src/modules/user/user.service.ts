import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  /**
   * 测试
   * @returns
   */
  getList(): string {
    return 'getList!';
  }
}
