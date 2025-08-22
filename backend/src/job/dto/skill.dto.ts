import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export class SkillDto {
  @ApiProperty({
    description: 'Name of the skill',
    example: 'React',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  skill: string;

  @ApiProperty({
    description: 'Proficiency level required for this skill',
    enum: SkillLevel,
    example: SkillLevel.EXPERT,
  })
  @IsEnum(SkillLevel)
  level: SkillLevel;

  @ApiProperty({
    description: 'Weight/importance of this skill (0.0 to 1.0)',
    example: 1.0,
    minimum: 0.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  weight: number;
}
