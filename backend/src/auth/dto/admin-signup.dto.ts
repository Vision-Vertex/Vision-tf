import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminSignupDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'First name can only contain letters and spaces',
  })
  firstname: string;

  @ApiPropertyOptional({
    description: 'User middle name (optional)',
    example: 'Michael',
    maxLength: 50,
  })
  @Transform(({ value }) => value?.trim())
  @IsOptional()
  @IsString({ message: 'Middle name must be a string' })
  @MaxLength(50, { message: 'Middle name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\s]*$/, {
    message: 'Middle name can only contain letters and spaces',
  })
  middlename?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Last name can only contain letters and spaces',
  })
  lastname: string;

  @ApiProperty({
    description: 'Unique username for the account',
    example: 'johndoe123',
    minLength: 3,
    maxLength: 30,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password (must meet strength requirements)',
    example: 'SecurePass123!',
    minLength: 8,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Admin invitation code (required for admin signup)',
    example: 'your_invitation_code_goes_here',
  })
  @IsString({ message: 'Invitation code must be a string' })
  @IsNotEmpty({ message: 'Invitation code is required' })
  invitationCode: string;

  @ApiPropertyOptional({
    description: 'User preferred language (ISO 639-1 code)',
    example: 'en',
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
  })
  @IsOptional()
  @IsString({ message: 'Preferred language must be a string' })
  @IsIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'], {
    message: 'Please select a valid language',
  })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'User timezone (IANA timezone identifier)',
    example: 'UTC',
    default: 'UTC',
    enum: [
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
    ],
  })
  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  @IsIn(
    [
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
    ],
    {
      message: 'Please select a valid timezone',
    },
  )
  timezone?: string;
}
