import { StaticModules } from 'src/common/const/modules.type';
import { ActivityAction } from 'src/common/const/action.type';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class NestedPermissionDto {
    @ApiProperty({ enum: StaticModules })
    @IsEnum(StaticModules)
    module: StaticModules;

    @ApiProperty({ enum: ActivityAction })
    @IsEnum(ActivityAction)
    action: ActivityAction;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateRoleDto {
    @ApiProperty({ example: 'Editor' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ 
        description: 'Array of existing Permission UUIDs',
        example: ['550e8400-e29b-41d4-a716-446655440000'],
        type: [String] 
    })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    permissions?: string[]; // Now accepts IDs
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}