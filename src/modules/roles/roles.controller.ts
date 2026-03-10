import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/utils/api-response';
import { CreateRoleDto, UpdateRoleDto, NestedPermissionDto } from './dto/roles.dto';

@ApiTags('Roles & Permissions')
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    // --- ROLE ENDPOINTS ---

    @ApiOperation({ summary: "Create new role with optional nested permissions" })
    @Post()
    async createRole(@Body() dto: CreateRoleDto) {
        const result = await this.rolesService.createRole(dto);
        return ApiResponse.success("Role created successfully", result);
    }

    @ApiOperation({ summary: "Get all roles" })
    @Get()
    async findAllRoles() {
        const result = await this.rolesService.findAllRoles();
        return ApiResponse.success("Roles fetched successfully", result);
    }

    @ApiOperation({ summary: "Get a single role by ID" })
    @Get(':id')
    async findOneRole(@Param('id') id: string) {
        const result = await this.rolesService.findOneRole(id);
        return ApiResponse.success("Role fetched successfully", result);
    }

    @ApiOperation({ summary: "Update role and its permissions" })
    @Patch(':id')
    async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        const result = await this.rolesService.updateRole(id, dto);
        return ApiResponse.success("Role updated successfully", result);
    }

    @ApiOperation({ summary: "Delete a role" })
    @Delete(':id')
    async deleteRole(@Param('id') id: string) {
        await this.rolesService.deleteRole(id);
        return ApiResponse.success("Role deleted successfully", {});
    }

    // --- PERMISSION ENDPOINTS ---

    @ApiOperation({ summary: "Create a standalone permission" })
    @Post('permissions')
    async createPermission(@Body() dto: NestedPermissionDto) {
        const result = await this.rolesService.createPermission(dto);
        return ApiResponse.success("Permission created successfully", result);
    }

    @ApiOperation({ summary: "Get all permissions available in the system" })
    @Get('permissions/all')
    async findAllPermissions() {
        const result = await this.rolesService.findAllPermissions();
        return ApiResponse.success("Permissions fetched successfully", result);
    }

    // --- ASSIGNMENT ENDPOINTS ---

    @ApiOperation({ summary: "Remove a specific permission from a role" })
    @Delete(':roleId/permissions/:permissionId')
    @ApiParam({ name: 'roleId', type: 'string' })
    @ApiParam({ name: 'permissionId', type: 'string' })
    async removePermission(
        @Param('roleId') roleId: string,
        @Param('permissionId') permissionId: string
    ) {
        await this.rolesService.removePermissionFromRole(roleId, permissionId);
        return ApiResponse.success("Permission removed from role successfully", null);
    }
}