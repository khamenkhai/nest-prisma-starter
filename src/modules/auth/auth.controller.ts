import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ApiResponse } from 'src/common/utils/api-response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @ApiOperation({ summary: 'Register a new user' })
    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        const response = await this.authService.register(createUserDto);
        return ApiResponse.success('User successfully registered', response);
    }

    @ApiOperation({ summary: 'Login user' })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            return { message: 'Invalid credentials' };
        }
        const response = await this.authService.login(user);
        return ApiResponse.success('User successfully registered', response);
    }

    @ApiOperation({ summary: 'Refresh access token' })
    @Post('refresh')
    async refresh(@Body() refreshDto: RefreshDto) {
        const response = await this.authService.refreshTokens(refreshDto.refreshToken);
        return ApiResponse.success('Token successfully refreshed', response);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Logout user' })
    @Post('logout')
    async logout(@Request() req) {
        const response = await this.authService.logout(req.user.id);
        return ApiResponse.success('User successfully logged out', response);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user profile' })
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
