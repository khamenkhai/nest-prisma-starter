import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      if (dto.permissions?.length) {
        const duplicateLink = await this.prisma.rolePermission.findFirst({
          where: {
            roleId: existingRole.id,
            permissionId: { in: dto.permissions },
          },
          include: { permission: true },
        });

        if (duplicateLink) {
          throw new ConflictException(
            `Role "${dto.name}" already has permission ID: ${duplicateLink.permissionId}`,
          );
        }
      } else {
        throw new ConflictException(
          `Role with name "${dto.name}" already exists.`,
        );
      }
    }

    return await this.prisma.role.create({
      data: {
        name: dto.name,
        rolePermissions: {
          create: dto.permissions?.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

    return await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        rolePermissions: dto.permissions
          ? {
              deleteMany: {},
              create: dto.permissions.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAllRoles() {
    return await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    return role;
  }

  async deleteRole(id: string): Promise<boolean> {
    try {
      await this.prisma.role.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findAllPermissions() {
    return await this.prisma.permission.findMany();
  }

  async deletePermission(id: string): Promise<boolean> {
    try {
      await this.prisma.permission.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    try {
      const result = await this.prisma.rolePermission.deleteMany({
        where: {
          roleId: roleId,
          permissionId: permissionId,
        },
      });
      return result.count > 0;
    } catch (error) {
      return false;
    }
  }
}
