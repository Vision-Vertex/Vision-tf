import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2faDto {
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

  @ApiProperty({
    description: '2FA verification code (6-digit TOTP code or backup code)',
    example: '123456',
    minLength: 6,
    maxLength: 8,
  })
  @IsString()
  code: string;
}
