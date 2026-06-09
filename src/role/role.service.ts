import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class RoleService {
  @Inject()
  private readonly prisma: PrismaService;

  // POST
  async createRole(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({ data });
  }

  // POST PARA VINCULAR A PERMISSÃO

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: { connect: { id: permissionId } },
      },
      include: { permissions: true },
    });
  }

  // GET POR ID
  async role(
    roleWhereUniqueInput: Prisma.RoleWhereUniqueInput,
  ): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        ...roleWhereUniqueInput,
        deletedAt: null,
      },
    });
  }

  // LISTA TODOS OS ROLES
  async roles(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoleWhereUniqueInput;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
  }): Promise<Role[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.role.findMany({
      skip,
      take,
      cursor,
      where: { ...where, deletedAt: null },
      orderBy,
    });
  }

  // UPDATE
  async updateRole(params: {
    where: Prisma.RoleWhereUniqueInput;
    data: { name: string };
  }): Promise<Role> {
    const { where, data } = params;
    return this.prisma.role.update({ where, data });
  }

  // DELETE
  async deleteRole(where: Prisma.RoleWhereUniqueInput): Promise<Role> {
    return this.prisma.role.update({
      where,
      data: { deletedAt: new Date() },
    });
  }
}
