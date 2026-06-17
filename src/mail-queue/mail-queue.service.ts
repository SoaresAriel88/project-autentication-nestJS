import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailQueueService {
  constructor(@InjectQueue('mail-queue') private readonly mailQueue: Queue) {}

  async sendOtpEmailVerifyMail(email: string, otpCode: string): Promise<void> {
    await this.mailQueue.add('send-otp', { email, otpCode });
  }
  async sendOtpEmailResetPassword(
    email: string,
    resetPasswordOtp: string,
  ): Promise<void> {
    await this.mailQueue.add('send-otp-reset-password', {
      email,
      resetPasswordOtp,
    });
  }
  async sendOtpConfirmatioResetPassword(email: string): Promise<void> {
    await this.mailQueue.add('send-confirmation-reset-password', { email });
  }
}
