import { select } from '@inquirer/prompts';
import { ServerConfig } from '@server/config';
import { ValidationError } from '@server/errors';
import { NodeEnv } from '@server/platform';
import { exec, spawn } from 'child_process';
import 'dotenv/config.js';

export class PrismaMigrate {
  private readonly UserSelect = {
    Type: 'Type',
    Local: 'Local',
    Dev: 'Dev',
    Production: 'Production',
  };

  constructor() {}

  async run(_param: string[], _options?: Record<string, any>): Promise<any> {
    const config = ServerConfig.get();
    const isLocalDatabase = !!config.DATABASE_URL.match(/(localhost|127\.0\.0\.1)/);

    const userSelect = await select({
      message: 'Which Prisma migrate command do you want to use?',
      choices: [
        { name: 'Migrate local', value: this.UserSelect.Local },
        { name: 'Migrate dev', value: this.UserSelect.Dev },
        { name: 'Migrate production', value: this.UserSelect.Production },
        { name: 'Generate type', value: this.UserSelect.Type },
      ],
    });

    switch (userSelect) {
      case this.UserSelect.Local:
        if (!isLocalDatabase) {
          throw new ValidationError(
            `The command prisma db push can only be use with prototype db (localhost). Condition: NODE_ENV=LOCAL and DATABASE_URL connect to localhost`,
          );
        }
        return this.interactiveCommand(
          'npx',
          ['prisma', 'db', 'push'],
          this.execCallback,
        );
      case this.UserSelect.Dev:
        if (config.NODE_ENV === NodeEnv.Production) {
          throw new ValidationError(`prisma migrate dev can not be use in production`);
        }
        return this.interactiveCommand(
          'npx',
          ['prisma', 'migrate', 'dev'],
          this.execCallback,
        );
      case this.UserSelect.Production:
        if (config.NODE_ENV !== NodeEnv.Production) {
          throw new ValidationError(
            `prisma migrate deploy can only be use in production`,
          );
        }
        return exec(`npx prisma migrate deploy`, this.execCallback);
      case this.UserSelect.Type:
        return exec(`npx prisma generate`, this.execCallback);
      default:
        return;
    }
  }

  private interactiveCommand(
    command: string,
    args: string[],
    callback: (error: any, stdout: any, stderr: any) => void,
  ) {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code !== 0) {
        callback(new Error(`Command failed with exit code ${code}`), null, null);
      } else {
        callback(null, 'Command executed successfully', null);
      }
    });
  }

  private execCallback(error: any, stdout: any, stderr: any) {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  }
}

(async function migrate() {
  const prismaMigrate = new PrismaMigrate();
  await prismaMigrate.run([]);
})();
