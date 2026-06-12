import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Confirmação de email',
      html: `<b>Seu código de verificação é: ${otp}</b>`,
    });
  }
}
