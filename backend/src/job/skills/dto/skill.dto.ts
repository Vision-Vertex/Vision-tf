import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, Max, IsArray, ArrayMinSize, ValidateNested, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum SkillCategory {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  DEVOPS = 'DEVOPS',
  MOBILE = 'MOBILE',
  DESIGN = 'DESIGN',
  TESTING = 'TESTING',
  AI_ML = 'AI_ML',
  BLOCKCHAIN = 'BLOCKCHAIN',
  GAME_DEV = 'GAME_DEV',
  OTHER = 'OTHER'
}

// Base skill DTO
export class SkillDto {
  @ApiProperty({ description: 'Unique identifier for the skill' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Name of the skill (e.g., React, Node.js)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Category of the skill', enum: SkillCategory })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiProperty({ description: 'Description of the skill' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'When the skill was created' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'When the skill was last updated' })
  @IsDateString()
  updatedAt: string;
}

// Create skill DTO
export class CreateSkillDto {
  @ApiProperty({ description: 'Name of the skill (e.g., React, Node.js)', example: 'React' })
  @IsString()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  name: string;

  @ApiProperty({ description: 'Category of the skill', enum: SkillCategory, example: SkillCategory.FRONTEND })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiProperty({ description: 'Description of the skill', required: false, example: 'A JavaScript library for building user interfaces' })
  @IsString()
  @IsOptional()
  @Max(1000)
  description?: string;
}

// Update skill DTO
export class UpdateSkillDto {
  @ApiProperty({ description: 'Name of the skill', required: false, example: 'React.js' })
  @IsString()
  @IsOptional()
  @Min(1)
  @Max(100)
  name?: string;

  @ApiProperty({ description: 'Category of the skill', enum: SkillCategory, required: false })
  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @ApiProperty({ description: 'Description of the skill', required: false })
  @IsString()
  @IsOptional()
  @Max(1000)
  description?: string;
}

// Job skill requirement DTO
export class JobSkillRequirementDto {
  @ApiProperty({ description: 'Name of the skill required', example: 'React' })
  @IsString()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  skill: string;

  @ApiProperty({ description: 'Required skill level', enum: SkillLevel, example: SkillLevel.EXPERT })
  @IsEnum(SkillLevel)
  level: SkillLevel;

  @ApiProperty({ description: 'Weight/importance of this skill (0.0 to 1.0)', example: 1.0 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  weight: number;

  @ApiProperty({ description: 'Additional notes about this skill requirement', required: false })
  @IsString()
  @IsOptional()
  @Max(200)
  notes?: string;
}

// Create job skills DTO
export class CreateJobSkillsDto {
  @ApiProperty({ description: 'Required skills for the job', type: [JobSkillRequirementDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JobSkillRequirementDto)
  requiredSkills: JobSkillRequirementDto[];

  @ApiProperty({ description: 'Preferred skills for the job', type: [JobSkillRequirementDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSkillRequirementDto)
  @IsOptional()
  preferredSkills?: JobSkillRequirementDto[];
}

// Update job skills DTO
export class UpdateJobSkillsDto {
  @ApiProperty({ description: 'Required skills for the job', type: [JobSkillRequirementDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSkillRequirementDto)
  @IsOptional()
  requiredSkills?: JobSkillRequirementDto[];

  @ApiProperty({ description: 'Preferred skills for the job', type: [JobSkillRequirementDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSkillRequirementDto)
  @IsOptional()
  preferredSkills?: JobSkillRequirementDto[];
}

// Skill validation response DTO
export class SkillValidationResponseDto {
  @ApiProperty({ description: 'Whether the skills are valid' })
  valid: boolean;

  @ApiProperty({ description: 'List of validation errors', type: [String] })
  errors: string[];

  @ApiProperty({ description: 'List of valid skills found', type: [String] })
  validSkills: string[];

  @ApiProperty({ description: 'List of invalid skills found', type: [String] })
  invalidSkills: string[];

  @ApiProperty({ description: 'Suggestions for similar skills', type: [String] })
  suggestions: string[];
}

// Skill search DTO
export class SkillSearchDto {
  @ApiProperty({ description: 'Search query for skills', example: 'React' })
  @IsString()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  query: string;

  @ApiProperty({ description: 'Filter by skill category', enum: SkillCategory, required: false })
  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @ApiProperty({ description: 'Maximum number of results', example: 10, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Skill suggestions DTO
export class SkillSuggestionsDto {
  @ApiProperty({ description: 'Project type for skill suggestions', example: 'WEB_APP' })
  @IsString()
  @IsNotEmpty()
  projectType: string;

  @ApiProperty({ description: 'List of suggested skills for the project type', type: [String] })
  skills: string[];

  @ApiProperty({ description: 'Explanation of why these skills are suggested' })
  explanation: string;
}
