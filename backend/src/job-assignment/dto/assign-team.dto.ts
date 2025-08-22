import { IsString, IsOptional, IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'Name of the team', example: 'Frontend Dev Team' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the team', example: 'Handles all frontend tasks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'List of developer IDs to include in the team', example: ['uuid-dev1', 'uuid-dev2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  developerIds: string[];
}
