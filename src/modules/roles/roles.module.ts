import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entity/roles.entity';
import { PermissionEntity } from './entity/permission.entity';
import { RolePermissionEntity } from './entity/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity, RolePermissionEntity])],
  controllers: [RolesController],
  providers: [RolesService]
})

export class RolesModule { }
