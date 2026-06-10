import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'The refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
