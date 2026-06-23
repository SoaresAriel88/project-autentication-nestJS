import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { MailQueueService } from 'src/mail-queue/mail-queue.service';

@Injectable()
export class AuthService {
  @Inject()
  private readonly prisma: PrismaService;

  @Inject()
  private readonly jwt: JwtService;

  @Inject()
  private readonly mailService: MailService;

  @Inject()
  private readonly mailQueueService: MailQueueService;

  async login(email: string, password: string, tenantSlug: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenant: {
          slug: tenantSlug,
        },
      },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch)
      throw new UnauthorizedException('Credenciais inválidas');

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    });

    return { token };
  }
  async generateOtpResetPassword(
    email: string,
    tenantSlug: string,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenant: {
          slug: tenantSlug,
        },
      },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const resetPasswordOtp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const resetPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: resetPasswordOtp,
        resetPasswordOtpExpiresAt: resetPasswordOtpExpiresAt,
      },
    });
    await this.mailQueueService.sendOtpEmailResetPassword(
      user.email,
      resetPasswordOtp,
    );
  }
  async verifyOtpResetPassword(
    email: string,
    resetPasswordOtp: string,
    tenantSlug: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenant: {
          slug: tenantSlug,
        },
      },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    if (user.resetPasswordOtp !== resetPasswordOtp)
      throw new UnauthorizedException('Código OTP inválido');

    if (
      !user.resetPasswordOtpExpiresAt ||
      new Date() > user.resetPasswordOtpExpiresAt
    )
      throw new UnauthorizedException('Código OTP expirado');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
      },
    });
    const token = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        purpose: 'reset-password',
      },
      { expiresIn: '10m' },
    );

    return { token };
  }
  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
      },
    });

    await this.mailQueueService.sendOtpConfirmatioResetPassword(user.email);

    return { message: 'Senha redefinida com sucesso' };
  }
}
