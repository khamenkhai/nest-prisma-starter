import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateRoleDto,
  UpdateRoleDto,
  NestedPermissionDto,
} from './dto/roles.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@Controller('')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Create new role with optional nested permissions' })
  @Post()
  @ResponseMessage('Role created successfully')
  async createRole(@Body() dto: CreateRoleDto) {
    return await this.rolesService.createRole(dto);
  }

  @ApiOperation({ summary: 'Get all roles' })
  @Get()
  @ResponseMessage('Roles fetched successfully')
  async findAllRoles() {
    return await this.rolesService.findAllRoles();
  }

  @ApiOperation({ summary: 'Get a single role by ID' })
  @Get(':id')
  @ResponseMessage('Role fetched successfully')
  async findOneRole(@Param('id') id: string) {
    return await this.rolesService.findOneRole(id);
  }

  @ApiOperation({ summary: 'Update role and its permissions' })
  @Patch(':id')
  @ResponseMessage('Role updated successfully')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return await this.rolesService.updateRole(id, dto);
  }

  @ApiOperation({ summary: 'Delete a role' })
  @Delete(':id')
  @ResponseMessage('Role deleted successfully')
  async deleteRole(@Param('id') id: string) {
    await this.rolesService.deleteRole(id);
    return {};
  }

  @ApiOperation({ summary: 'Get all permissions available in the system' })
  @Get('permissions/all')
  @ResponseMessage('Permissions fetched successfully')
  async findAllPermissions() {
    return await this.rolesService.findAllPermissions();
  }

  @ApiOperation({ summary: 'Remove a specific permission from a role' })
  @Delete(':roleId/permissions/:permissionId')
  @ApiParam({ name: 'roleId', type: 'string' })
  @ApiParam({ name: 'permissionId', type: 'string' })
  @ResponseMessage('Permission removed from role successfully')
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.rolesService.removePermissionFromRole(roleId, permissionId);
    return null;
  }
}
