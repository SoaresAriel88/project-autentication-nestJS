import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(data: { name: string; slug: string }): Promise<Tenant> {
    const tenant = await this.prisma.tenant.create({ data });
    return tenant;
  }
}
