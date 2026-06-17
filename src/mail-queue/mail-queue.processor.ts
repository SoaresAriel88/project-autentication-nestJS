import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/mail/mail.service';
import { Inject } from '@nestjs/common';

@Processor('mail-queue')
export class MailQueueProcessor extends WorkerHost {
  @Inject()
  private readonly mailService: MailService;

  async process(job: Job): Promise<void> {
    if (job.name == 'send-otp') {
      const { email, otpCode } = job.data as { email: string; otpCode: string };
      await this.mailService.sendOtpEmailVerifyMail(email, otpCode);
    } else if (job.name == 'send-otp-reset-password') {
      const { email, resetPasswordOtp } = job.data as {
        email: string;
        resetPasswordOtp: string;
      };
      await this.mailService.sendOtpEmailResetPassword(email, resetPasswordOtp);
    } else if (job.name == 'send-confirmation-reset-password') {
      const { email } = job.data as {
        email: string;
      };
      await this.mailService.sendOtpConfirmatioResetPassword(email);
    }
  }
}
