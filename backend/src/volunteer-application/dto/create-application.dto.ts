import { IsUUID, IsString, IsOptional, IsNumber, IsArray, IsEnum, IsUrl, IsObject, ValidateNested, ArrayMinSize, ArrayMaxSize, Min, Max, IsDateString, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class SkillDto {
  @ApiProperty({ description: 'Skill name', example: 'React' })
  @IsString()
  skill: string;

  @ApiProperty({ description: 'Skill level', example: 'EXPERT', enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'] })
  @IsString()
  level: string;

  @ApiProperty({ description: 'Years of experience with this skill', example: 3 })
  @IsNumber()
  @Min(0)
  @Max(50)
  years: number;
}

export class ReferenceDto {
  @ApiProperty({ description: 'Reference name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Reference email', example: 'john@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Relationship to reference', example: 'Previous Client' })
  @IsString()
  relationship: string;
}

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
  @Min(1)
  @Max(168)
  maxHoursPerWeek?: number;

  @ApiPropertyOptional({
    description: 'Preferred project types',
    example: ['web', 'mobile'],
  })
  @IsArray()
  @IsOptional()
  preferredProjectTypes?: string[];
}

export class QuestionDto {
  @ApiProperty({ description: 'Question text', example: 'What is the expected timeline for this project?' })
  @IsString()
  question: string;
}

/**
 * DTO for creating a volunteer application
 * 
 * Note: Many fields are auto-populated from the developer's profile if not provided:
 * - skills (from profile.skills)
 * - availability (from profile.availability)
 * - proposedRate (from profile.hourlyRate)
 * - proposedCurrency (from profile.currency)
 * - portfolio (from profile.portfolioLinks)
 * - relevantExperience (from profile.experience)
 * - motivation (generated from profile.experience)
 */
export class CreateApplicationDto {
  @ApiProperty({ description: 'Job ID to apply for', example: 'uuid-job' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Cover letter - required for each application', example: 'I am excited to apply for this position...' })
  @IsString()
  @MaxLength(5000)
  coverLetter: string;

  @ApiPropertyOptional({ 
    description: 'Motivation for applying (auto-populated from profile if not provided)', 
    example: 'I am passionate about this type of work...' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivation?: string;

  @ApiPropertyOptional({ 
    description: 'Relevant experience description (auto-populated from profile if not provided)', 
    example: 'I have 5 years of experience in...' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  relevantExperience?: string;

  @ApiPropertyOptional({ 
    description: 'Proposed hourly rate (auto-populated from profile if not provided)', 
    example: 50.0 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proposedRate?: number;

  @ApiPropertyOptional({ 
    description: 'Currency for proposed rate (auto-populated from profile if not provided)', 
    example: 'USD' 
  })
  @IsOptional()
  @IsString()
  proposedCurrency?: string;

  @ApiPropertyOptional({ description: 'Estimated hours to complete the job', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedHours?: number;

  @ApiPropertyOptional({ 
    description: 'Availability information (auto-populated from profile if not provided)' 
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability?: AvailabilityDto;

  @ApiPropertyOptional({ 
    description: 'Skills array (auto-populated from profile if not provided)', 
    type: [SkillDto] 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @ArrayMaxSize(20)
  skills?: SkillDto[];

  @ApiPropertyOptional({ 
    description: 'Portfolio URL (auto-populated from profile if not provided)', 
    example: 'https://portfolio.example.com' 
  })
  @IsOptional()
  @IsUrl()
  portfolio?: string;

  @ApiPropertyOptional({ description: 'References array', type: [ReferenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  @ArrayMaxSize(5)
  references?: ReferenceDto[];

  @ApiPropertyOptional({ description: 'Questions for the client', type: [QuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  @ArrayMaxSize(10)
  questions?: QuestionDto[];

  @ApiPropertyOptional({ description: 'Attachment URLs', example: ['https://example.com/resume.pdf'] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Application priority', enum: ApplicationPriority, example: ApplicationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;
}
