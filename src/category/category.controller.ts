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
import { Category as CategoryModel, Status } from '@prisma/client';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get(':id')
  async getCategoryById(
    @Param('id') id: string,
  ): Promise<CategoryModel | null> {
    return this.categoryService.category({ id });
  }

  @Get()
  async getCategories(): Promise<CategoryModel[]> {
    return this.categoryService.categories({
      where: { status: 'ACTIVE' },
    });
  }
  @Post()
  async createCategory(
    @Body() categoryData: { name: string; status: Status },
  ): Promise<CategoryModel> {
    return this.categoryService.createCategory(categoryData);
  }
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() categoryData: { name: string; status: Status },
  ): Promise<CategoryModel> {
    return this.categoryService.updateCategory({
      where: { id },
      data: categoryData,
    });
  }
  @Delete(':id')
  async deleteCategory(@Param('id') id: string): Promise<CategoryModel> {
    return this.categoryService.deleteCategory({ id });
  }
}
