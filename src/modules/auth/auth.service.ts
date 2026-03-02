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

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      const { password, refreshToken, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: UserEntity) {
    const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    
    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '172800000');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '604800000');

    // Fix: Create proper JwtSignOptions objects
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { 
          secret: accessTokenSecret,
          expiresIn: accessTokenExpiresIn as any 
        }
      ),
      this.jwtService.signAsync(
        { sub: user.id },
        { 
          secret: refreshTokenSecret,
          expiresIn: refreshTokenExpiresIn as any 
        }
      ),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(user.id, { refreshToken: hashedRefreshToken });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  //^^^^ there is still error to fix
  async refreshTokens(refreshToken: string) {
    try {
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      
      if (!refreshTokenSecret) {
        throw new UnauthorizedException('Refresh token secret not configured');
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
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

      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    return this.usersService.update(userId, { refreshToken: '' });
  }
}