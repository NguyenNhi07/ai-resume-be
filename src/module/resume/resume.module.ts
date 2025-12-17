import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { PublicResumeController } from './public-resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [],
  controllers: [ResumeController, PublicResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
