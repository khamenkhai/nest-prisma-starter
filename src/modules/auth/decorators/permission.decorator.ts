import { SetMetadata } from '@nestjs/common';
import { PermissionRequirement } from 'src/common/const/permission.type';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (requirement: PermissionRequirement) => {
    // We combine module and action to create a unique string key: e.g., "products:create"
    const permissionString = `${requirement.module}:${requirement.action}`;
    return SetMetadata(PERMISSIONS_KEY, [permissionString]);
};