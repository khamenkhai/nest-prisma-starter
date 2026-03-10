import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSeeder } from 'src/database/seeders/auth.seeder';
import { RoleEntity } from 'src/modules/roles/entity/roles.entity';
import { PermissionEntity } from 'src/modules/roles/entity/permission.entity';
import { RolePermissionEntity } from 'src/modules/roles/entity/role-permission.entity';
import { UserEntity } from 'src/modules/users/entity/user.entity';

import dataSource, { dataSourceOption } from '../data-source';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOption),
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserEntity,
    ]),
  ],
  providers: [AuthSeeder],
  exports: [AuthSeeder],
})
export class SeederModule {}
