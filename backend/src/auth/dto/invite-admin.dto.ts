import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteAdminDto {
  @ApiProperty({
    description: 'Email address of the person to invite as admin',
    example: 'newadmin@example.com',
    format: 'email',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiPropertyOptional({
    description: 'Custom message to include in the invitation email',
    example: 'You have been invited to join our team as an administrator.',
  })
  @IsOptional()
  @IsString({ message: 'Message must be a string' })
  message?: string;
}
