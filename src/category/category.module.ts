import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { DatabaseModule } from 'src/database/database.module';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoryController],
  providers: [CategoryService, PermissionGuard, Reflector],
})
export class CategoryModule {}
