import { IsUUID, IsString, IsOptional, IsNumber, IsArray, IsEnum, IsUrl, IsObject, ValidateNested, ArrayMinSize, ArrayMaxSize, Min, Max, IsDateString } from 'class-validator';
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
  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2024-06-01' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Hours per week', example: 40 })
  @IsNumber()
  @Min(1)
  @Max(168)
  hoursPerWeek: number;
}

export class QuestionDto {
  @ApiProperty({ description: 'Question text', example: 'What is the expected timeline for this project?' })
  @IsString()
  question: string;
}

export class CreateApplicationDto {
  @ApiProperty({ description: 'Job ID to apply for', example: 'uuid-job' })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({ description: 'Cover letter', example: 'I am excited to apply for this position...' })
  @IsOptional()
  @IsString()
  @Max(5000)
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Proposed hourly rate', example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proposedRate?: number;

  @ApiPropertyOptional({ description: 'Currency for proposed rate', example: 'USD' })
  @IsOptional()
  @IsString()
  proposedCurrency?: string;

  @ApiPropertyOptional({ description: 'Estimated hours to complete the job', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Availability information' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability?: AvailabilityDto;

  @ApiPropertyOptional({ description: 'Skills array', type: [SkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  skills?: SkillDto[];

  @ApiPropertyOptional({ description: 'Portfolio URL', example: 'https://portfolio.example.com' })
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

  @ApiPropertyOptional({ description: 'Motivation for applying', example: 'I am passionate about this type of work...' })
  @IsOptional()
  @IsString()
  @Max(2000)
  motivation?: string;

  @ApiPropertyOptional({ description: 'Relevant experience description', example: 'I have 5 years of experience in...' })
  @IsOptional()
  @IsString()
  @Max(3000)
  relevantExperience?: string;

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
