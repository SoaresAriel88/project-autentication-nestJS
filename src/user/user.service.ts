import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  @Inject()
  private readonly prisma: PrismaService;
  @Inject()
  private readonly mailService: MailService;

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        otpCode,
        otpExpiresAt,
      },
    });

    await this.mailService.sendOtpEmail(user.email, otpCode);

    return user;
  }
  async addRoleToUser(roleId: string, userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: { connect: { id: roleId } },
      },
      include: { roles: true },
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
  async verifyOtp(email: string, otpCode: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    if (user.otpCode !== otpCode)
      throw new UnauthorizedException('Código OTP inválido');

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt)
      throw new UnauthorizedException('Código OTP expirado');

    return this.prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });
  }
}
