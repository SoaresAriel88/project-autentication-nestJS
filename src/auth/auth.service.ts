import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  @Inject()
  private readonly prisma: PrismaService;

  @Inject()
  private readonly jwt: JwtService;

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch)
      throw new UnauthorizedException('Credenciais inválidas');

    const token = this.jwt.sign({ sub: user.id, email: user.email });

    return { token };
  }
}
