import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ServerConfig } from '@server/config';
import { ServerLogger } from '@server/logger';
import { exec } from 'child_process';
import { ensureDirectoryExists } from 'src/common/helpers/file-system';
import { getCurrentTime } from 'src/common/helpers/time';
import { DatabaseService } from 'src/module/base/database';

@Injectable()
export class TaskScheduleService {
  constructor(private readonly databaseService: DatabaseService) {}

  @Cron('0 0 * * *', { disabled: ServerConfig.isLocalEnv() })
  async backupDatabaseDaily() {
    const { BACKUP_PATH } = ServerConfig.get();
    const { user, password, host, port, database } =
      ServerConfig.getDatabaseCredentials();

    await ensureDirectoryExists(BACKUP_PATH);

    const backupCommand = `mysqldump -u ${user} -p'${password}' -h ${host} -P ${port} \\
       --no-create-db=TRUE \\
       --set-gtid-purged=COMMENT \\
       --skip-add-drop-table \\
       --lock-all-tables \\
       --skip-ssl \\
       ${database} > ${BACKUP_PATH}/backup-${getCurrentTime()}.sql`;

    const backupLanguageCallback = (error: any, _stdout: any, stderr: any) => {
      if (stderr) {
        ServerLogger.error({
          error: { string: stderr?.toString() },
          message: `Warning or error when backup`,
          context: 'TasksScheduleService.backupDatabaseDaily',
        });
      }
      if (error) {
        ServerLogger.error({
          error: { errorDetail: error, stderr },
          message: `Error when backup`,
          context: 'TasksScheduleService.backupDatabaseDaily',
        });
        return;
      }
      ServerLogger.info({
        message: `Backup language data successfully`,
        context: 'TasksScheduleService.backupDatabaseDaily',
      });
    };
    exec(backupCommand, backupLanguageCallback);
  }
}
