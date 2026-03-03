import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entity/user.entity';
import { JwtPayload } from 'src/modules/auth/types/jwt-payload';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  async register(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.usersService.create({
      email: createUserDto.email,
      username: createUserDto.username,
      role: createUserDto.role,
      password: hashedPassword,
    });
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

    const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets are not configured');
    }

    // Define the payload using your interface
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '2d')
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: refreshTokenSecret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d')
        }
      ),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(hashedRefreshToken, user.id);

    // Return user data without sensitive information
    const { password: _, refreshToken: __, ...userData } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userData
    };
  }

  async refreshNewTokens(refreshToken: string) {
    try {
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

      if (!refreshTokenSecret) {
        throw new UnauthorizedException('Refresh token secret not configured');
      }

      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: refreshTokenSecret,
      });

      const userId = payload.sub;
      const user = await this.usersService.findOne(userId);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const isMatching = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatching) {
        throw new UnauthorizedException();
      }

      // Generate new access token only (not calling login function)
      const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

      if (!accessTokenSecret) {
        throw new Error('JWT access secret is not configured');
      }

      const accessPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = await this.jwtService.signAsync(accessPayload, {
        secret: accessTokenSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '2d')
      });

      // Optionally generate a new refresh token for better security (rotation)
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: refreshTokenSecret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d')
        }
      );

      // Hash and store the new refresh token
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.usersService.updateRefreshToken(hashedNewRefreshToken, user.id);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      };

    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    return this.usersService.update(userId, { refreshToken: '' });
  }
}