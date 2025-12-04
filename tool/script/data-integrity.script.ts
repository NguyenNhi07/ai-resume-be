import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BaseModule } from 'src/module/base';
import { DatabaseService } from 'src/module/base/database';

@Module({
  imports: [BaseModule],
})
class DataIntegrityScript {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {
    // this.identifyResolutionMapping()
    // this.ensureCompany().then((r) => {
    //   console.log(r);
    // });
    // this.addAvatarForCompany().then((r) => console.log(r));
    // this.identifyResolutionStatus();
  }
}

(async function start() {
  const app = await NestFactory.createApplicationContext(DataIntegrityScript);
  const script = app.get(DataIntegrityScript);
  // await script.identifyResolutionMapping();
  return app.close();
})();
