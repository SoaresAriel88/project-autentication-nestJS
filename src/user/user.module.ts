import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { MailModule } from 'src/mail/mail.module';
import { MailQueueModule } from 'src/mail-queue/mail-queue.module';

@Module({
  imports: [DatabaseModule, MailModule, MailQueueModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
