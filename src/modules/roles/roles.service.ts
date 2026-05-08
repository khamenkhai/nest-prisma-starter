import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RoleEntity } from './entity/roles.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  NestedPermissionDto,
} from './dto/roles.dto';
import { RolePermissionEntity } from './entity/role-permission.entity';
import { PermissionEntity } from './entity/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(PermissionEntity)
    private permissionRepository: Repository<PermissionEntity>,
  ) {}

  async createRole(dto: CreateRoleDto) {
    let rolePermissions: RolePermissionEntity[] = [];

    if (dto.permissions?.length) {
      rolePermissions = dto.permissions.map((id) => {
        const rp = new RolePermissionEntity();
        rp.permission = { id } as PermissionEntity;
        return rp;
      });
    }

    const existingRole = await this.rolesRepository.findOne({
      where: { name: dto.name },
    });

    if (existingRole && dto.permissions?.length) {
      const duplicateLink = await this.rolePermissionRepository.findOne({
        where: {
          role: { id: existingRole.id },
          permission: { id: In(dto.permissions) },
        },
        relations: ['permission'],
      });

      if (duplicateLink) {
        throw new ConflictException(
          `Role "${dto.name}" already has permission ID: ${duplicateLink.permission.id}`,
        );
      }
    } else if (existingRole) {
      throw new ConflictException(
        `Role with name "${dto.name}" already exists.`,
      );
    }

    const role = this.rolesRepository.create({
      name: dto.name,
      rolePermissions: rolePermissions,
    });

    return await this.rolesRepository.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.findOneRole(id);
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

    if (dto.name) role.name = dto.name;

    if (dto.permissions) {
      await this.rolePermissionRepository.delete({ role: { id } });

      role.rolePermissions = dto.permissions.map((pId) => {
        const rp = new RolePermissionEntity();
        rp.permission = { id: pId } as PermissionEntity;
        return rp;
      });
    }

    await this.rolesRepository.save(role);

    return await this.findOneRole(id);
  }

  async findAllRoles() {
    return await this.rolesRepository.find();
  }

  async findOneRole(id: string) {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    return role;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await this.rolesRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAllPermissions() {
    return await this.permissionRepository.find();
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await this.permissionRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const result = await this.rolePermissionRepository.delete({
      role: { id: roleId },
      permission: { id: permissionId },
    });
    return (result.affected ?? 0) > 0;
  }
}
