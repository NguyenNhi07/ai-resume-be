import { Address } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

export interface SendMailOptions {
  to: string | Address | Array<string | Address>;
  cc?: string | Address | Array<string | Address>;
  bcc?: string | Address | Array<string | Address>;
  from?: string;
  subject: string;
  template?: string;
  variables?: object;
}
