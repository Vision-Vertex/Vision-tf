import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description:
      'Enable "Remember me" functionality for extended session duration',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @ApiPropertyOptional({
    description: 'Screen resolution for device fingerprinting',
    example: '1920x1080',
  })
  @IsOptional()
  @IsString()
  screenResolution?: string;

  @ApiPropertyOptional({
    description: 'Timezone for device fingerprinting',
    example: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Language for device fingerprinting',
    example: 'en-US',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
