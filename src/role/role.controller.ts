import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Role as RoleModel } from '@prisma/client';
import { RoleService } from './role.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('role')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get(':id')
  async getRoleById(@Param('id') id: string): Promise<RoleModel | null> {
    return this.roleService.role({ id });
  }

  @Get()
  async getRoles(): Promise<RoleModel[]> {
    return this.roleService.roles({});
  }
  //CRIAR PERMISSION
  @Post()
  async createRole(@Body() roleData: { name: string }): Promise<RoleModel> {
    return this.roleService.createRole(roleData);
  }
  //ADICIONAR PERMISSION AO USER
  @Post(':id/permission')
  async addPermission(
    @Param('id') roleId: string,
    @Body() body: { permissionId: string },
  ): Promise<RoleModel> {
    return this.roleService.addPermissionToRole(roleId, body.permissionId);
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() roleData: { name: string },
  ): Promise<RoleModel> {
    return this.roleService.updateRole({
      where: { id },
      data: roleData,
    });
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: string): Promise<RoleModel> {
    return this.roleService.deleteRole({ id });
  }
}
