import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entity/user.entity';
import { JwtPayload } from './types/jwt-payload';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../roles/entity/roles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    if (createUserDto.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: createUserDto.roleId },
      });
      if (!role) {
        throw new BadRequestException('Invalid role ID');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.usersService.create({
      email: createUserDto.email,
      username: createUserDto.username,
      roleId: createUserDto.roleId,
      password: hashedPassword,
    });
  }

  // Helper to build payload with fresh permissions
  private async buildJwtPayload(user: UserEntity): Promise<JwtPayload> {
    const permissions =
      user.role?.rolePermissions?.map((rp) => rp.permission.name) || [];

    return {
      sub: user.id,
      email: user.email,
      roleId: user.role?.id,
      roleName: user.role?.name,
      permissions: permissions,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessTokenSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets are not configured');
    }

    // 2. Build Payload with fresh permissions
    const payload = await this.buildJwtPayload(user);

    // 3. Generate Tokens
    // SHORT EXPIRATION FOR ACCESS TOKEN (Balanced Approach)
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'), // e.g., 15 minutes
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: refreshTokenSecret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    // 4. Store Refresh Token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(hashedRefreshToken, user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshNewTokens(refreshToken: string) {
    try {
      const refreshTokenSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!refreshTokenSecret)
        throw new UnauthorizedException('Refresh token secret not configured');

      // 1. Verify Refresh Token Integrity
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: refreshTokenSecret,
        },
      );

      const userId = payload.sub;

      // 2. Fetch User FRESH from DB (Do not trust old token data)
      // This is where the "Dynamic" update happens.
      // We fetch the user and their NEW permissions.
      const user = await this.usersService.findOne(userId);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      // 3. Verify Refresh Token matches DB (Replay protection)
      const isMatching = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatching) {
        throw new UnauthorizedException('Invalid Token');
      }

      // 4. Generate NEW Access Token with FRESH Permissions
      const accessTokenSecret =
        this.configService.get<string>('JWT_ACCESS_SECRET');
      if (!accessTokenSecret)
        throw new Error('JWT access secret is not configured');

      const newPayload = await this.buildJwtPayload(user);

      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        secret: accessTokenSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'), // Keep short
      });

      // 5. (Optional but recommended) Rotate Refresh Token
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        { secret: refreshTokenSecret, expiresIn: '7d' },
      );

      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.usersService.updateRefreshToken(
        hashedNewRefreshToken,
        user.id,
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    return this.usersService.update(userId, { refreshToken: '' });
  }
}
