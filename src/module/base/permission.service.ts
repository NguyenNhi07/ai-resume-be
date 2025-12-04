import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database';

@Injectable()
export class PermissionService {
  constructor(private readonly databaseService: DatabaseService) {}

  // todo: VanLuc write code here
}
