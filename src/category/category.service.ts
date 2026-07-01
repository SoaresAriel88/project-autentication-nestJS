import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, Category, Status } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // POST
  async createCategory(data: {
    name: string;
    status: Status;
    parentId?: string;
    tenantId: string;
  }): Promise<Category> {
    const { parentId, tenantId, name, status } = data;

    return this.prisma.category.create({
      data: {
        name,
        status,
        ...(parentId && { parent: { connect: { id: parentId } } }),
        tenant: {
          connect: {
            id: tenantId,
          },
        },
      },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });
  }

  // GET POR ID
  async category(
    categoryWhereUniqueInput: Prisma.CategoryWhereUniqueInput,
  ): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        ...categoryWhereUniqueInput,
        deletedAt: null,
      },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });
  }

  // LISTA TODOS OS DADOS
  async categories(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }): Promise<Category[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.category.findMany({
      skip,
      take,
      cursor,
      where: { ...where, deletedAt: null },
      orderBy,
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });
  }

  // UPDATE
  async updateCategory(params: {
    where: Prisma.CategoryWhereUniqueInput;
    data: { name: string; status: Status; parentId?: string };
  }): Promise<Category> {
    const { where, data } = params;
    const { parentId, ...rest } = data;

    return this.prisma.category.update({
      where,
      data: {
        ...rest,
        ...(parentId && { parent: { connect: { id: parentId } } }),
      },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });
  }

  // DELETE
  async deleteCategory(
    where: Prisma.CategoryWhereUniqueInput,
  ): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where });

    if (category) {
      await this.prisma.category.updateMany({
        where: { parentId: category.id },
        data: { deletedAt: new Date() },
      });
    }

    return this.prisma.category.update({
      where,
      data: { deletedAt: new Date() },
    });
  }
}
