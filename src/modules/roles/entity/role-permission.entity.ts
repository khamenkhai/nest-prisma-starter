import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RoleEntity } from './roles.entity';
import { PermissionEntity } from './permission.entity';

@Entity('role_permission')
export class RolePermissionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RoleEntity, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: RoleEntity;

    @ManyToOne(() => PermissionEntity, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission: PermissionEntity;
}
