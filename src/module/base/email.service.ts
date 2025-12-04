import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SendMailOptions } from './base.type';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  public async send(options?: SendMailOptions) {
    return this.mailerService.sendMail({ ...options, context: options.variables });
  }
}
