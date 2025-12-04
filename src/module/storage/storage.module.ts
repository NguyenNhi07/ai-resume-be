import { Module } from '@nestjs/common';
import { LocalStorageController } from './local-storage.controller';
import { LocalStorageService } from './local-storage.service';

@Module({
  imports: [],
  controllers: [LocalStorageController],
  providers: [LocalStorageService],
  exports: [LocalStorageService],
})
export class StorageModule {}
