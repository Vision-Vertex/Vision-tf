import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEmail,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
  IsPhoneNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'UTC-5' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^UTC[+-]\d{1,2}$/, {
    message: 'Timezone must be in UTC format (e.g., UTC+5, UTC-3)',
  })
  @IsOptional()
  timezone?: string;
}

export class BillingAddressDto {
  @ApiPropertyOptional({ description: 'Street', example: '123 Main St' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @Matches(/^[0-9A-Za-z\- ]{3,15}$/, {
    message:
      'Postal code must be 3-15 characters and alphanumeric with dashes/spaces allowed',
  })
  @IsOptional()
  postalCode?: string;
}

export class CustomLinkDto {
  @ApiPropertyOptional({ description: 'Label', example: 'Facebook' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  label: string;

  @ApiPropertyOptional({
    description: 'URL',
    example: 'https://facebook.com/company',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Company Facebook page',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @IsOptional()
  description?: string | null;
}

export class SocialLinksDto {
  @ApiPropertyOptional({
    description: 'LinkedIn URL',
    example: 'https://linkedin.com/company',
  })
  @IsUrl()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://company.com',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'X (Twitter) URL',
    example: 'https://twitter.com/company',
  })
  @IsUrl()
  @IsOptional()
  x?: string;

  @ApiPropertyOptional({
    type: [CustomLinkDto],
    description: 'Custom company links',
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CustomLinkDto)
  @IsOptional()
  customLinks?: CustomLinkDto[];
}

export class ProjectPreferencesDto {
  @ApiPropertyOptional({
    description: 'Typical project budget',
    example: '1k-5k',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsOptional()
  typicalProjectBudget?: string;

  @ApiPropertyOptional({
    description: 'Typical project duration',
    example: '1-3 months',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsOptional()
  typicalProjectDuration?: string;

  @ApiPropertyOptional({
    description: 'Preferred communication methods',
    example: ['email', 'chat'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsOptional()
  preferredCommunication?: string[];

  @ApiPropertyOptional({ description: 'Timezone preference', example: 'UTC+3' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^UTC[+-]\d{1,2}$/, {
    message: 'Timezone must be in UTC format (e.g., UTC+5, UTC-3)',
  })
  @IsOptional()
  timezonePreference?: string;

  @ApiPropertyOptional({
    description: 'Project types',
    example: ['web', 'mobile'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsOptional()
  projectTypes?: string[];
}

export class UpdateClientProfileDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Tech Co.' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techco.com',
  })
  @IsUrl()
  @IsOptional()
  companyWebsite?: string;

  @ApiPropertyOptional({ description: 'Company size', example: '51-200' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  companySize?: string;

  @ApiPropertyOptional({ description: 'Industry', example: 'Technology' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading tech solutions provider',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  @IsOptional()
  companyDescription?: string;

  @ApiPropertyOptional({ description: 'Contact person', example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'contact@techco.com',
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+1234567890' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format',
  })
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ type: LocationDto, description: 'Location details' })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({
    type: BillingAddressDto,
    description: 'Billing address',
  })
  @ValidateNested()
  @Type(() => BillingAddressDto)
  @IsOptional()
  billingAddress?: BillingAddressDto;

  @ApiPropertyOptional({
    type: ProjectPreferencesDto,
    description: 'Project preferences',
  })
  @ValidateNested()
  @Type(() => ProjectPreferencesDto)
  @IsOptional()
  projectPreferences?: ProjectPreferencesDto;

  @ApiPropertyOptional({ type: SocialLinksDto, description: 'Social links' })
  @ValidateNested()
  @Type(() => SocialLinksDto)
  @IsOptional()
  socialLinks?: SocialLinksDto;
}
