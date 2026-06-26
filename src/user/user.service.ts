import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { MailQueueService } from 'src/mail-queue/mail-queue.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UserService {
  @Inject()
  private readonly prisma: PrismaService;
  @Inject()
  private readonly mailService: MailService;
  @Inject()
  private readonly mailQueueService: MailQueueService;
  @Inject()
  private readonly redisService: RedisService;

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    tenantSlug: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const { tenantSlug, email, name } = data;
    const otpKey = `tenant:${tenantSlug}:auth:otp:verify-email:${email}`;

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        tenant: {
          connect: {
            slug: tenantSlug,
          },
        },
      },
    });
    await this.redisService.setWithExpiration(otpKey, otpCode, 600);
    await this.mailQueueService.sendOtpEmailVerifyMail(user.email, otpCode);

    return user;
  }
  async addRoleToUser(roleId: string, userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: user.tenantId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrada nesse tenant');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: {
            id: roleId,
          },
        },
      },
      include: {
        roles: true,
      },
    });
  }
  async getMe(id: string): Promise<Partial<User> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
  }
  async verifyOtp(
    email: string,
    otpCode: string,
    tenantSlug: string,
  ): Promise<User> {
    if (!tenantSlug) {
      throw new BadRequestException('Tenant é obrigatório');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenant: {
          slug: tenantSlug,
        },
      },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const otpKey = `tenant:${tenantSlug}:auth:otp:verify-email:${email}`;
    const savedOtp = await this.redisService.getValue(otpKey);
    if (!savedOtp) {
      throw new UnauthorizedException('Código expirado');
    }

    if (savedOtp !== otpCode) {
      throw new UnauthorizedException('Código inválido');
    }

    const userEmailVerified = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });
    await this.redisService.deleteKey(otpKey);
    return userEmailVerified;
  }
  async resendOtp(email: string, tenantSlug: string): Promise<void> {
    if (!tenantSlug) {
      throw new BadRequestException('Tenant é obrigatório');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenant: {
          slug: tenantSlug,
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    if (user.emailVerified) {
      throw new BadRequestException('E-mail já verificado');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `tenant:${tenantSlug}:auth:otp:verify-email:${email}`;

    await this.redisService.setWithExpiration(otpKey, otpCode, 600);
    await this.mailQueueService.sendOtpEmailVerifyMail(user.email, otpCode);
  }
}
