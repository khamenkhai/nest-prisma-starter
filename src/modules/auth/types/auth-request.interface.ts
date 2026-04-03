export class AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

// Extend the standard Express Request
export class RequestWithUser extends Request {
  user: AuthenticatedUser;
}
