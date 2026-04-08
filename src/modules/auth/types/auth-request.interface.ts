export class AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export class RequestWithUser extends Request {
  user: AuthenticatedUser;
}
