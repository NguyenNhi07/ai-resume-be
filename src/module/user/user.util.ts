import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/module/base/database';

@Injectable()
export class UserUtil {
  constructor(private readonly databaseService: DatabaseService) {}
}
