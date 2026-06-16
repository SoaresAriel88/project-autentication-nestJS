import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailQueueService {
  constructor(@InjectQueue('mail-queue') private readonly mailQueue: Queue) {}

  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    await this.mailQueue.add('send-otp', { email, otpCode });
  }
}
