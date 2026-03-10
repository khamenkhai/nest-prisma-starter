import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'src/modules/auth/types/jwt-payload';
import { AuthenticatedUser } from 'src/modules/auth/types/auth-request.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // This validates the token signature first, then calls this method with the payload
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Since the payload now contains the permissions assigned during Login/Refresh,
    // we simply map them to the return object.
    // The data is TRUSTED because it was signed by our server.

    return {
      id: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions,
    };
  }
}