import { ActivityAction } from 'src/common/const/action.type';
import { StaticModules } from 'src/common/const/modules.type';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Unique } from 'typeorm';


@Entity('permissions')
@Unique(['module', 'action'])
export class PermissionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: StaticModules,
    })
    module: StaticModules;

    @Column({
        type: 'enum',
        enum: ActivityAction,
    })
    action: ActivityAction;

    @Column({ nullable: true })
    description: string;
    
    get name(): string {
        return `${this.module}:${this.action}`;
    }
}