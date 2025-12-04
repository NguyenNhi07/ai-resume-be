import { PropertyDto } from 'src/decorator';

export class TriggerBackupDatabaseResponseDto {
  @PropertyDto()
  message: string;
}
