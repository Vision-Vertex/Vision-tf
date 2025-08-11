import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2faDto {
  @ApiProperty({
    description: '2FA verification code from authenticator app or backup code',
    example: '123456',
    minLength: 6,
    maxLength: 8,
  })
  @IsString()
  code: string;
}
