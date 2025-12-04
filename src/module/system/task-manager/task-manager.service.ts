import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TaskScheduleService } from '../task-schedule.service';

@Injectable()
export class TaskManagerService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly taskScheduleService: TaskScheduleService,
  ) {}

  async triggerBackupDatabase() {
    await this.taskScheduleService.backupDatabaseDaily();
    return { message: 'Backup database triggered successfully' };
  }
}
