import { Logger, Module } from '@nestjs/common';
import { Command, CommandFactory, CommandRunner } from 'nest-commander';
import { AdminCommand } from './admin.command';

@Module({
  imports: [AdminCommand],
})
@Command({
  name: 'command-executor',
  description: 'Nestjs command executor',
  aliases: ['run'],
  subCommands: [AdminCommand],
})
class CommandExecutor extends CommandRunner {
  constructor() {
    super();
  }

  async run(_param: string[], options?: Record<string, any>): Promise<void> {
    // Implementation of the command
  }
}

(async function run() {
  await CommandFactory.run(CommandExecutor)
    .then(() => {
      Logger.log(`Command executed successfully`);
    })
    .catch((error) => {
      Logger.error(`Error executing command: ${error.message}`, error);
    });
})();
