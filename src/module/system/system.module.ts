import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { TaskManagerController } from './task-manager/task-manager.controller';
import { TaskManagerService } from './task-manager/task-manager.service';
import { TaskScheduleService } from './task-schedule.service';

@Module({
  imports: [TerminusModule.forRoot(), ScheduleModule.forRoot()],
  controllers: [SystemController, TaskManagerController],
  providers: [SystemService, TaskManagerService, TaskScheduleService],
})
export class SystemModule {}
