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

@Injectable()
export class UserService {
  @Inject()
  private readonly prisma: PrismaService;
  @Inject()
  private readonly mailService: MailService;
  @Inject()
  private readonly mailQueueService: MailQueueService;

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    tenantSlug: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const { tenantSlug, email, name } = data;

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        otpCode,
        otpExpiresAt,
        tenant: {
          connect: {
            slug: tenantSlug,
          },
        },
      },
    });

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

    if (user.otpCode !== otpCode)
      throw new UnauthorizedException('Código OTP inválido');

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt)
      throw new UnauthorizedException('Código OTP expirado');

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });
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
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    await this.mailQueueService.sendOtpEmailVerifyMail(user.email, otpCode);
  }
}
