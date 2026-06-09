import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { User as UserModel } from '@prisma/client';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup')
  async signupUser(
    @Body() userData: { email: string; name: string; password: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Post(':id/role')
  async addRole(
    @Param('id') userId: string,
    @Body() body: { roleId: string },
  ): Promise<UserModel> {
    return this.userService.addRoleToUser(body.roleId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: { user: { id: string; email: string } }) {
    return this.userService.getMe(req.user.id);
  }
}
