import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Assign a role to a user' })
  @Patch(':id/role')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ResponseMessage('Role assigned successfully')
  async assignRole(@Param('id') userId: string, @Body() dto: AssignRoleDto) {
    return await this.usersService.assignRole(userId, dto.roleId);
  }
}
