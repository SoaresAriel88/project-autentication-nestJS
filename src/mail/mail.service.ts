import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmailVerifyMail(to: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Confirmação de email',
      html: `<b>Seu código de verificação é: ${otp}</b>`,
    });
  }
  async sendOtpEmailResetPassword(to: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Recuperação de Senha',
      html: `<b>Seu código de verificação é: ${otp}</b>`,
    });
  }
  async sendOtpConfirmatioResetPassword(to: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Senha alterada com sucesso!',
      html: `<b>Sua senha foi alterada com sucesso</b>`,
    });
  }
}
