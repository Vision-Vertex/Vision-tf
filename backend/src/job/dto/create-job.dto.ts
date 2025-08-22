import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({
    description: 'Job title/name',
    example: 'Full-Stack React Developer Needed',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed job requirements and description',
    example: 'We need an experienced React developer to build a modern web application...',
    minLength: 50,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Project completion deadline',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({
    description: 'Array of required skills with levels and weights',
    example: [
      { skill: 'React', level: 'EXPERT', weight: 1.0 },
      { skill: 'TypeScript', level: 'ADVANCED', weight: 0.8 }
    ],
  })
  @IsOptional()
  @IsArray()
  requiredSkills?: any[];

  @ApiPropertyOptional({
    description: 'Array of nice-to-have skills with levels and weights',
    example: [
      { skill: 'Node.js', level: 'INTERMEDIATE', weight: 0.5 }
    ],
  })
  @IsOptional()
  @IsArray()
  preferredSkills?: any[];

  @ApiPropertyOptional({
    description: 'Payment structure object',
    example: {
      type: 'FIXED',
      amount: 5000,
      currency: 'USD'
    },
  })
  @IsOptional()
  @IsObject()
  budget?: any;

  @ApiPropertyOptional({
    description: 'Estimated project duration in hours',
    example: 80,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: 'Priority level of the job',
    enum: JobPriority,
    example: JobPriority.MEDIUM,
    default: JobPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({
    description: 'Type of project',
    enum: ProjectType,
    example: ProjectType.WEB_APP,
  })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional({
    description: 'Work location preference',
    enum: WorkLocation,
    example: WorkLocation.REMOTE,
    default: WorkLocation.REMOTE,
  })
  @IsOptional()
  @IsEnum(WorkLocation)
  location?: WorkLocation;

  @ApiPropertyOptional({
    description: 'Array of file attachment URLs or identifiers',
    example: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    isArray: true,
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Array of tags for job categorization',
    example: ['react', 'typescript', 'fullstack', 'remote'],
    isArray: true,
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Job visibility settings',
    enum: JobVisibility,
    example: JobVisibility.PUBLIC,
    default: JobVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(JobVisibility)
  visibility?: JobVisibility;

  @ApiPropertyOptional({
    description: 'Additional project requirements',
    example: 'Must be available for weekly meetings and provide daily updates',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Expected project deliverables',
    example: ['Source code', 'Documentation', 'Deployment guide'],
    isArray: true,
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];

  @ApiPropertyOptional({
    description: 'Project constraints or limitations',
    example: 'Must use React 18+ and be compatible with existing legacy system',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  constraints?: string;

  @ApiPropertyOptional({
    description: 'Identified risk factors for the project',
    example: ['Tight deadline', 'Complex integration requirements'],
    isArray: true,
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];
}
