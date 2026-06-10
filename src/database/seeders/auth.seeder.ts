import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    console.log('🌱 Seeding Super Admin, Roles, and Permissions...');

    // 1. Create all permissions
    const permissionNames = [
      'todo.create',
      'todo.read',
      'todo.update',
      'todo.delete',
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
    ];
    const permissions: any[] = [];

    for (const name of permissionNames) {
      let permission = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (!permission) {
        permission = await this.prisma.permission.create({
          data: { name },
        });
      }
      permissions.push(permission);
    }

    // 2. Create Super Admin Role
    let superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'superadmin' },
    });

    if (!superAdminRole) {
      superAdminRole = await this.prisma.role.create({
        data: { name: 'superadmin' },
      });
    }

    // 3. Create role-permissions (link permissions to the role)
    for (const permission of permissions) {
      const exists = await this.prisma.rolePermission.findFirst({
        where: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });

      if (!exists) {
        await this.prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    // 4. Create a Super Admin User if one doesn't exist
    await this.createDefaultAdminUser(superAdminRole.id);

    console.log('✅ Superadmin role and all permissions seeded!');
  }

  private async createDefaultAdminUser(roleId: string) {
    const adminEmail = 'admin@example.com';
    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          username: 'System Administrator',
          password: hashedPassword,
          roleId: roleId,
        },
      });
      console.log(`👤 Created default user: ${adminEmail}`);
    }
  }
}
