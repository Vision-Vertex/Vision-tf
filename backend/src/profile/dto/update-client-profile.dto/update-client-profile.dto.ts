import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'UTC-5' })
  @IsString()
  @IsOptional()
  timezone?: string;
}

class BillingAddressDto {
  @ApiPropertyOptional({ description: 'Street', example: '123 Main St' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsString()
  @IsOptional()
  postalCode?: string;
}

class CustomLinkDto {
  @ApiPropertyOptional({ description: 'Label', example: 'Facebook' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'URL', example: 'https://facebook.com/company' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Company Facebook page' })
  @IsString()
  @IsOptional()
  description?: string | null;
}

class SocialLinksDto {
  @ApiPropertyOptional({ description: 'LinkedIn URL', example: 'https://linkedin.com/company' })
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://company.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'X (Twitter) URL', example: 'https://twitter.com/company' })
  @IsString()
  @IsOptional()
  x?: string;

  @ApiPropertyOptional({ type: [CustomLinkDto], description: 'Custom company links' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomLinkDto)
  @IsOptional()
  customLinks?: CustomLinkDto[];
}

class ProjectPreferencesDto {
  @ApiPropertyOptional({ description: 'Typical project budget', example: '1k-5k' })
  @IsString()
  @IsOptional()
  typicalProjectBudget?: string;

  @ApiPropertyOptional({ description: 'Typical project duration', example: '1-3 months' })
  @IsString()
  @IsOptional()
  typicalProjectDuration?: string;

  @ApiPropertyOptional({ description: 'Preferred communication methods', example: ['email', 'chat'] })
  @IsArray()
  @IsOptional()
  preferredCommunication?: string[];

  @ApiPropertyOptional({ description: 'Timezone preference', example: 'UTC+3' })
  @IsString()
  @IsOptional()
  timezonePreference?: string;

  @ApiPropertyOptional({ description: 'Project types', example: ['web', 'mobile'] })
  @IsArray()
  @IsOptional()
  projectTypes?: string[];
}

export class UpdateClientProfileDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Tech Co.' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Company website URL', example: 'https://techco.com' })
  @IsString()
  @IsOptional()
  companyWebsite?: string;

  @ApiPropertyOptional({ description: 'Company size', example: '51-200' })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiPropertyOptional({ description: 'Industry', example: 'Technology' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Company description', example: 'Leading tech solutions provider' })
  @IsString()
  @IsOptional()
  companyDescription?: string;

  @ApiPropertyOptional({ description: 'Contact person', example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@techco.com' })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+1234567890' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ type: LocationDto, description: 'Location details' })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ type: BillingAddressDto, description: 'Billing address' })
  @ValidateNested()
  @Type(() => BillingAddressDto)
  @IsOptional()
  billingAddress?: BillingAddressDto;

  @ApiPropertyOptional({ type: ProjectPreferencesDto, description: 'Project preferences' })
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
