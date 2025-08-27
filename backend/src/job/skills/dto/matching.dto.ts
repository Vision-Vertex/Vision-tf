import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, Max, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { SkillLevel } from './skill.dto';

export enum MatchPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW'
}

// Matching algorithm configuration DTO
export class MatchingConfigDto {
  @ApiProperty({ description: 'Threshold for HIGH priority matches (0.0 to 1.0)', example: 0.8 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  highPriorityThreshold: number = 0.8;

  @ApiProperty({ description: 'Threshold for MEDIUM priority matches (0.0 to 1.0)', example: 0.5 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  mediumPriorityThreshold: number = 0.5;

  @ApiProperty({ description: 'Threshold for LOW priority matches (0.0 to 1.0)', example: 0.3 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  lowPriorityThreshold: number = 0.3;

  @ApiProperty({ description: 'Weight for required skills in overall match calculation (0.0 to 1.0)', example: 0.7 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  requiredSkillsWeight: number = 0.7;

  @ApiProperty({ description: 'Weight for preferred skills in overall match calculation (0.0 to 1.0)', example: 0.3 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  preferredSkillsWeight: number = 0.3;

  @ApiProperty({ description: 'Bonus points for exact skill level matches (0.0 to 1.0)', example: 0.1 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  exactLevelBonus: number = 0.1;

  @ApiProperty({ description: 'Penalty for missing required skills (0.0 to 1.0)', example: 0.2 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  missingRequiredPenalty: number = 0.2;

  @ApiProperty({ description: 'Minimum match percentage to be considered for a job', example: 0.1 })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  minimumMatchThreshold: number = 0.1;
}

// Update matching configuration DTO
export class UpdateMatchingConfigDto {
  @ApiProperty({ description: 'Threshold for HIGH priority matches', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  highPriorityThreshold?: number;

  @ApiProperty({ description: 'Threshold for MEDIUM priority matches', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  mediumPriorityThreshold?: number;

  @ApiProperty({ description: 'Threshold for LOW priority matches', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  lowPriorityThreshold?: number;

  @ApiProperty({ description: 'Weight for required skills', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  requiredSkillsWeight?: number;

  @ApiProperty({ description: 'Weight for preferred skills', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  preferredSkillsWeight?: number;

  @ApiProperty({ description: 'Bonus for exact level matches', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  exactLevelBonus?: number;

  @ApiProperty({ description: 'Penalty for missing required skills', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  missingRequiredPenalty?: number;

  @ApiProperty({ description: 'Minimum match threshold', required: false })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  @IsOptional()
  minimumMatchThreshold?: number;
}

// Individual skill match result DTO
export class SkillMatchDto {
  @ApiProperty({ description: 'Name of the skill' })
  @IsString()
  @IsNotEmpty()
  skill: string;

  @ApiProperty({ description: 'Required skill level', enum: SkillLevel })
  @IsEnum(SkillLevel)
  requiredLevel: SkillLevel;

  @ApiProperty({ description: 'Whether the user has this skill' })
  userHasSkill: boolean;

  @ApiProperty({ description: 'Match score for this skill (0.0 to 1.0)' })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  matchScore: number;

  @ApiProperty({ description: 'Additional notes about this skill match', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

// Job match result DTO
export class JobMatchResultDto {
  @ApiProperty({ description: 'User ID being matched' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Job ID being matched against' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Overall match percentage (0.0 to 1.0)' })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  overallMatch: number;

  @ApiProperty({ description: 'Match percentage for required skills (0.0 to 1.0)' })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  requiredSkillsMatch: number;

  @ApiProperty({ description: 'Match percentage for preferred skills (0.0 to 1.0)' })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  preferredSkillsMatch: number;

  @ApiProperty({ description: 'Priority level based on match percentage', enum: MatchPriority })
  @IsEnum(MatchPriority)
  priority: MatchPriority;

  @ApiProperty({ description: 'Individual skill matches', type: [SkillMatchDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillMatchDto)
  skillMatches: SkillMatchDto[];

  @ApiProperty({ description: 'List of skills the user has that match job requirements', type: [String] })
  @IsArray()
  @IsString({ each: true })
  matchedSkills: string[];

  @ApiProperty({ description: 'List of required skills the user is missing', type: [String] })
  @IsArray()
  @IsString({ each: true })
  missingSkills: string[];

  @ApiProperty({ description: 'Recommendations for improving match', type: [String] })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({ description: 'When this match was calculated' })
  calculatedAt: string;
}

// Skill gap analysis DTO
export class SkillGapAnalysisDto {
  @ApiProperty({ description: 'User ID for analysis' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Job ID for analysis' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'List of missing required skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  missingRequiredSkills: string[];

  @ApiProperty({ description: 'List of missing preferred skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  missingPreferredSkills: string[];

  @ApiProperty({ description: 'List of user skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  userSkills: string[];

  @ApiProperty({ description: 'List of job required skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  jobRequiredSkills: string[];

  @ApiProperty({ description: 'List of job preferred skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  jobPreferredSkills: string[];

  @ApiProperty({ description: 'Recommendations for skill development', type: [String] })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({ description: 'Overall skill gap score (0.0 to 1.0)' })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  gapScore: number;
}

// Matching query DTO
export class MatchingQueryDto {
  @ApiProperty({ description: 'Maximum number of results to return', example: 10, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: 'Minimum match percentage to include in results', example: 0.3, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0.0)
  @Max(1.0)
  minMatchPercentage?: number = 0.0;

  @ApiProperty({ description: 'Include only high priority matches', required: false })
  @IsOptional()
  highPriorityOnly?: boolean = false;

  @ApiProperty({ description: 'Sort results by match percentage (descending)', required: false })
  @IsOptional()
  sortByMatch?: boolean = true;
}
