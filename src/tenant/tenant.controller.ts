import { Body, Controller, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant as TenantModel } from '@prisma/client';

@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}
  @Post()
  async createTenant(
    @Body() tenantData: { name: string; slug: string },
  ): Promise<TenantModel> {
    return this.tenantService.createTenant(tenantData);
  }
}
