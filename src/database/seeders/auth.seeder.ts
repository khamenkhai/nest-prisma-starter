import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../modules/roles/entity/roles.entity';
import { PermissionEntity } from '../../modules/roles/entity/permission.entity';
import { RolePermissionEntity } from '../../modules/roles/entity/role-permission.entity';
import { UserEntity } from 'src/modules/users/entity/user.entity';
import { ActivityAction } from '../../common/const/action.type';
import { StaticModules } from '../../common/const/modules.type';

@Injectable()
export class AuthSeeder {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async seed() {
    console.log('🌱 Seeding Super Admin, Roles, and Permissions...');

    // 1. Create all permissions for all modules and actions
    const allModules = Object.values(StaticModules);
    const allActions = Object.values(ActivityAction);
    const permissions: PermissionEntity[] = [];

    for (const module of allModules) {
      for (const action of allActions) {
        let permission = await this.permissionRepository.findOne({ 
          where: { module, action } 
        });

        if (!permission) {
          permission = this.permissionRepository.create({ module, action });
          permission = await this.permissionRepository.save(permission);
        }
        permissions.push(permission);
      }
    }

    let superAdminRole = await this.roleRepository.findOne({ 
      where: { name: 'superadmin' } 
    });

    if (!superAdminRole) {
      superAdminRole = this.roleRepository.create({ 
        name: 'superadmin',
      });
      superAdminRole = await this.roleRepository.save(superAdminRole);
    }

    // 3. Create role-permissions (link permissions to the role)
    for (const permission of permissions) {
      const exists = await this.rolePermissionRepository.findOne({ 
        where: { 
          role: { id: superAdminRole.id }, 
          permission: { id: permission.id } 
        } 
      });

      if (!exists) {
        const rp = this.rolePermissionRepository.create({ 
          role: superAdminRole, 
          permission 
        });
        await this.rolePermissionRepository.save(rp);
      }
    }

    // 4. (Optional) Create a Super Admin User if one doesn't exist
    await this.createDefaultAdminUser(superAdminRole);

    console.log('✅ Superadmin role and all permissions seeded!');
  }

  private async createDefaultAdminUser(role: RoleEntity) {
    const adminEmail = 'admin@example.com';
    const existingUser = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (!existingUser) {
      const user = this.userRepository.create({
        email : adminEmail,
        username : 'System Administrator',
        password : 'Password123!',
        role : role,
      });
      await this.userRepository.save(user);
      console.log(`👤 Created default user: ${adminEmail}`);
    }
  }
}