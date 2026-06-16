import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/mail/mail.service';
import { Inject } from '@nestjs/common';

@Processor('mail-queue')
export class MailQueueProcessor extends WorkerHost {
  @Inject()
  private readonly mailService: MailService;

  async process(job: Job): Promise<void> {
    const { email, otpCode } = job.data as { email: string; otpCode: string };
    await this.mailService.sendOtpEmail(email, otpCode);
  }
}
