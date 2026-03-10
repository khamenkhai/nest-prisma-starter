import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermissionEntity } from './role-permission.entity';

@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => RolePermissionEntity, (rolePermission: RolePermissionEntity) => rolePermission.role, { cascade: true, eager: true })
    rolePermissions: RolePermissionEntity[];
}
