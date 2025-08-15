import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEmail, IsPhoneNumber } from 'class-validator';

export class CompanyInfoDto {
  @ApiPropertyOptional({ description: 'Name of the company', example: 'Tech Solutions Inc.' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Website of the company', example: 'https://techsolutions.com' })
  @IsUrl()
  @IsOptional()
  companyWebsite?: string;

  @ApiPropertyOptional({ description: 'Size of the company', example: '51-200 employees' })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiPropertyOptional({ description: 'Industry the company operates in', example: 'Software Development' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Short description of the company', example: 'We build innovative SaaS products.' })
  @IsString()
  @IsOptional()
  companyDescription?: string;

  @ApiPropertyOptional({ description: 'Name of the contact person at the company', example: 'John Doe' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact email for the company', example: 'contact@techsolutions.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone number for the company', example: '+1-555-123-4567' })
  @IsPhoneNumber(undefined) 
  @IsOptional()
  contactPhone?: string;
}
