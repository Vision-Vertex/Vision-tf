import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsArray,
  IsString,
  IsObject,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CompletionBreakdownDto {
  @ApiProperty({
    description: 'Overall completion percentage',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  overall: number;

  @ApiProperty({
    description: 'Completion breakdown by category',
    example: {
      basic: 100,
      professional: 80,
      availability: 60,
      contact: 100,
    },
  })
  @IsObject()
  breakdown: Record<string, number>;

  @ApiProperty({
    description: 'List of missing fields',
    example: ['location', 'hourlyRate'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  missingFields: string[];

  @ApiProperty({
    description: 'Suggestions for improving profile completion',
    example: [
      'Add your location to help with timezone coordination',
      'Set your hourly rate to help clients understand your pricing',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  suggestions: string[];
}

export class ProfileCompletionDto {
  @ApiProperty({
    description: 'Profile completion details',
    type: CompletionBreakdownDto,
  })
  completion: CompletionBreakdownDto;

  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  @IsString()
  lastUpdated: string;
}

export class CompletionStatsDto {
  @ApiProperty({
    description: 'Average completion percentage across all profiles',
    example: 75,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  averageCompletion: number;

  @ApiProperty({
    description: 'Distribution of completion levels',
    example: {
      '0-25': 10,
      '26-50': 25,
      '51-75': 40,
      '76-100': 25,
    },
  })
  @IsObject()
  completionDistribution: Record<string, number>;

  @ApiProperty({
    description: 'Number of profiles with low completion (0-25%)',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  lowCompletionCount: number;

  @ApiProperty({
    description: 'Total number of profiles analyzed',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  totalProfiles: number;
}

export class FieldValidationDto {
  @ApiProperty({
    description: 'Field name',
    example: 'displayName',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Whether the field is valid',
    example: true,
  })
  @IsBoolean()
  isValid: boolean;

  @ApiPropertyOptional({
    description: 'Validation error message if field is invalid',
    example: 'Display name is required',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({
    description: 'Field value',
    example: 'John Doe',
  })
  @IsString()
  value: string;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  @IsBoolean()
  required: boolean;
}

export class ProfileValidationDto {
  @ApiProperty({
    description: 'Whether the entire profile is valid',
    example: true,
  })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({
    description: 'Number of valid fields',
    example: 8,
  })
  @IsNumber()
  validFieldsCount: number;

  @ApiProperty({
    description: 'Number of invalid fields',
    example: 2,
  })
  @IsNumber()
  invalidFieldsCount: number;

  @ApiProperty({
    description: 'Total number of fields',
    example: 10,
  })
  @IsNumber()
  totalFieldsCount: number;

  @ApiProperty({
    description: 'Validation percentage',
    example: 80,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  validationPercentage: number;

  @ApiProperty({
    description: 'Field validation details',
    type: [FieldValidationDto],
  })
  @IsArray()
  fieldValidations: FieldValidationDto[];

  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Validation timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  @IsString()
  validatedAt: string;
}

export class RequiredFieldDto {
  @ApiProperty({
    description: 'Field name',
    example: 'displayName',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Field display name',
    example: 'Display Name',
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Field description',
    example: 'Your public display name',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Field category',
    example: 'basic',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    description: 'Field type',
    example: 'string',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Field validation rules',
    example: { minLength: 2, maxLength: 50 },
  })
  @IsObject()
  validationRules?: Record<string, any>;
}

export class ProfileRequiredFieldsDto {
  @ApiProperty({
    description: 'User role',
    example: 'DEVELOPER',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Required fields by category',
    type: [RequiredFieldDto],
  })
  @IsArray()
  requiredFields: RequiredFieldDto[];

  @ApiProperty({
    description: 'Total number of required fields',
    example: 10,
  })
  @IsNumber()
  totalRequiredFields: number;

  @ApiProperty({
    description: 'Number of completed required fields',
    example: 8,
  })
  @IsNumber()
  completedRequiredFields: number;

  @ApiProperty({
    description: 'Completion percentage for required fields',
    example: 80,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  requiredFieldsCompletion: number;
}
