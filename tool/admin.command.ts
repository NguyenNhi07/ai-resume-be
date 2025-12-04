import {Logger, Module} from '@nestjs/common';
import {UserRole, UserStatus} from '@prisma/client';
import {isEmail} from 'class-validator';
import {CommandRunner, Option, SubCommand} from 'nest-commander';
import {ServerConfig} from '@server/config';
import {ERROR_RESPONSE} from 'src/common/const';
import {ValidationError} from '@server/errors';
import {bcrypt} from '@server/libs/bcrypt';
import {ServerException} from 'src/exception';
import {DatabaseModule, DatabaseService} from 'src/module/base/database';

@Module({
  imports: [DatabaseModule],
  providers: [DatabaseService],
})
@SubCommand({name: 'admin'})
export class AdminCommand extends CommandRunner {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  async run(_param: string[], options?: Record<string, any>): Promise<void> {
    try {
      const {email, password} = options;

      const isUserExist = await this.databaseService.user.findFirst({
        where: {email},
      });
      if (isUserExist) {
        throw new ServerException(ERROR_RESPONSE.USER_ALREADY_EXISTED);
      }

      const hashPassword = await bcrypt.hash(
        password,
        ServerConfig.get().BCRYPT_SALT_ROUNDS,
      );
      await this.databaseService.user.create({
        data: {
          email,
          firstName: 'System',
          lastName: 'Admin',
          fullName: 'System Admin',
          role: UserRole.Admin,
          password: hashPassword,
          status: UserStatus.Active,
        },
      });
      Logger.log(`User created successfully`);
    } catch (error) {
      Logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  @Option({
    flags: '-e, --email <email>',
    description: 'User email',
    required: true,
  })
  parseEmail(val: string): string {
    if (!isEmail(val)) {
      throw new ValidationError(`Incorrect email`);
    }
    return val;
  }

  @Option({
    flags: '-p, --password <password>',
    description: 'User password',
    required: true,
  })
  parsePassword(val: string): string {
    // if (!SYSTEM_REGEXS.USER_PASSWORD_SIMPLE.test(val)) {
    //   throw new ValidationError(ERROR_RESPONSE.PASSWORD_NOT_SECURE.message);
    // }
    return val;
  }
}
