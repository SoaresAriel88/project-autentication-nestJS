import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Category as CategoryModel, Status } from '@prisma/client';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { JwtUser } from 'src/auth/types/jwt-user.type';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get(':id')
  @Permissions('read:category')
  async getCategoryById(
    @Param('id') id: string,
  ): Promise<CategoryModel | null> {
    return this.categoryService.category({ id });
  }

  @Get()
  @Permissions('read:category')
  async getCategories(): Promise<CategoryModel[]> {
    return this.categoryService.categories({
      where: { status: 'ACTIVE' },
    });
  }

  @Post()
  @Permissions('create:category')
  async createCategory(
    @Req() request: { user: JwtUser },
    @Body()
    categoryData: {
      name: string;
      status: Status;
      parentId?: string;
    },
  ): Promise<CategoryModel> {
    return this.categoryService.createCategory({
      ...categoryData,
      tenantId: request.user.tenantId,
    });
  }

  @Put(':id')
  @Permissions('update:category')
  async updateCategory(
    @Param('id') id: string,
    @Body() categoryData: { name: string; status: Status; parentId?: string },
  ): Promise<CategoryModel> {
    return this.categoryService.updateCategory({
      where: { id },
      data: categoryData,
    });
  }

  @Delete(':id')
  @Permissions('delete:category')
  async deleteCategory(@Param('id') id: string): Promise<CategoryModel> {
    return this.categoryService.deleteCategory({ id });
  }
}
