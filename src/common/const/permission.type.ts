import { ActivityAction } from "./action.type";
import { StaticModules } from "./modules.type";

export interface PermissionRequirement {
    module: StaticModules;
    action: ActivityAction;
}