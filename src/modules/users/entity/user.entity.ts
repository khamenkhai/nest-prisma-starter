import { RoleEntity } from 'src/modules/roles/entity/roles.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 150, unique: true })
  email: string;

  // @Column({
  //   type: 'enum',
  //   enum: UserRole,
  //   default: UserRole.USER,
  // })
  // role: UserRole;

  @ManyToOne(() => RoleEntity, { eager: true })
  role: RoleEntity;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ length: 255, select: false, nullable: true })
  password?: string;

  @Column({ nullable: true, select: false })
  refreshToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}