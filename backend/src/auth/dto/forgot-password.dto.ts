import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address for password reset',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
