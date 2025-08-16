import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AvailabilityDto {
  @ApiPropertyOptional({
    description: 'Currently available for work',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({ description: 'Preferred work hours', example: '9-5' })
  @IsString()
  @IsOptional()
  hours?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'UTC+3' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Notice period', example: '2 weeks' })
  @IsString()
  @IsOptional()
  noticePeriod?: string;

  @ApiPropertyOptional({ description: 'Max hours per week', example: 40 })
  @IsNumber()
  @IsOptional()
  maxHoursPerWeek?: number;

  @ApiPropertyOptional({
    description: 'Preferred project types',
    example: ['web', 'mobile'],
  })
  @IsArray()
  @IsOptional()
  preferredProjectTypes?: string[];
}

export class PortfolioLinkDto {
  @ApiPropertyOptional({
    description: 'Label for custom link',
    example: 'Instagram',
  })
  @IsString()
  label: string;

  @ApiPropertyOptional({
    description: 'URL of custom link',
    example: 'https://instagram.com/user',
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Description of link usage',
    example: 'Portfolio showcase',
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}

export class PortfolioLinksDto {
  @ApiPropertyOptional({
    description: 'GitHub profile URL',
    example: 'https://github.com/user',
  })
  @IsString()
  @IsOptional()
  github?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/user',
  })
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
    example: 'https://userwebsite.com',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'X (Twitter) profile URL',
    example: 'https://twitter.com/user',
  })
  @IsString()
  @IsOptional()
  x?: string;

  @ApiPropertyOptional({
    type: [PortfolioLinkDto],
    description: 'Custom social or professional links',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioLinkDto)
  @IsOptional()
  customLinks?: PortfolioLinkDto[];
}

export class CertificationDto {
  @ApiPropertyOptional({
    description: 'Certification name',
    example: 'AWS Certified Solutions Architect',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Issuing organization',
    example: 'Amazon',
  })
  @IsString()
  issuer: string;

  @ApiPropertyOptional({ description: 'Date obtained', example: '2023-01-15' })
  @IsString()
  dateObtained: string;

  @ApiPropertyOptional({ description: 'Expiry date', example: '2025-01-15' })
  @IsString()
  @IsOptional()
  expiryDate?: string | null;

  @ApiPropertyOptional({ description: 'Credential ID', example: '12345-abcde' })
  @IsString()
  @IsOptional()
  credentialId?: string | null;
}

export class EducationDto {
  @ApiPropertyOptional({
    description: 'Degree',
    example: "Bachelor's in Computer Science",
  })
  @IsString()
  @IsOptional()
  degree?: string;

  @ApiPropertyOptional({ description: 'Institution name', example: 'MIT' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ description: 'Graduation year', example: 2020 })
  @IsNumber()
  @IsOptional()
  graduationYear?: number;

  @ApiPropertyOptional({
    type: [CertificationDto],
    description: 'Professional certifications',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[];
}

export class WorkPreferencesDto {
  @ApiPropertyOptional({
    description: 'Willing to work remotely',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  remoteWork?: boolean;

  @ApiPropertyOptional({
    description: 'Willing to work on-site',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  onSiteWork?: boolean;

  @ApiPropertyOptional({ description: 'Willing to work hybrid', example: true })
  @IsBoolean()
  @IsOptional()
  hybridWork?: boolean;

  @ApiPropertyOptional({
    description: 'Travel willingness',
    example: 'national',
  })
  @IsString()
  @IsOptional()
  travelWillingness?: string;

  @ApiPropertyOptional({
    description: 'Contract types',
    example: ['hourly', 'fixed'],
  })
  @IsArray()
  @IsOptional()
  contractTypes?: string[];

  @ApiPropertyOptional({
    description: 'Minimum project duration',
    example: '1-2 weeks',
  })
  @IsString()
  @IsOptional()
  minProjectDuration?: string;

  @ApiPropertyOptional({
    description: 'Maximum project duration',
    example: '6+ months',
  })
  @IsString()
  @IsOptional()
  maxProjectDuration?: string;
}

export class UpdateDeveloperProfileDto {
  @ApiPropertyOptional({
    description: 'Skills',
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ description: 'Years of experience', example: 5 })
  @IsNumber()
  @IsOptional()
  experience?: number;

  @ApiPropertyOptional({ description: 'Hourly rate in USD', example: 50.0 })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    type: AvailabilityDto,
    description: 'Availability and work preferences',
  })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @IsOptional()
  availability?: AvailabilityDto;

  @ApiPropertyOptional({
    type: PortfolioLinksDto,
    description: 'Portfolio and social links',
  })
  @ValidateNested()
  @Type(() => PortfolioLinksDto)
  @IsOptional()
  portfolioLinks?: PortfolioLinksDto;

  @ApiPropertyOptional({
    type: EducationDto,
    description: 'Education and certifications',
  })
  @ValidateNested()
  @Type(() => EducationDto)
  @IsOptional()
  education?: EducationDto;

  @ApiPropertyOptional({
    type: WorkPreferencesDto,
    description: 'Work preferences',
  })
  @ValidateNested()
  @Type(() => WorkPreferencesDto)
  @IsOptional()
  workPreferences?: WorkPreferencesDto;
}
export class AddSkillDto {
  @ApiPropertyOptional({
    description: 'Single skill to add',
    example: 'TypeScript',
  })
  @IsString()
  @IsNotEmpty()
  skill: string;
}

export class UpdateSkillsDto {
  @ApiPropertyOptional({
    description: 'Skills array to update',
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skills: string[];
}

export class SkillSuggestionDto {
  @ApiPropertyOptional({
    description: 'Suggested skills',
    example: ['TypeScript', 'Vue.js', 'MongoDB'],
  })
  @IsArray()
  @IsString({ each: true })
  suggestions: string[];
}

export class AvailabilityResponseDto {
  @ApiPropertyOptional({ description: 'Availability settings' })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  @IsOptional()
  availability?: AvailabilityDto;

  @ApiPropertyOptional({ description: 'Work preferences' })
  @ValidateNested()
  @Type(() => WorkPreferencesDto)
  @IsOptional()
  workPreferences?: WorkPreferencesDto;
}
