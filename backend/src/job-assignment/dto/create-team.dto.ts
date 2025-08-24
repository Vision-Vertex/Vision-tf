import { IsString, IsOptional, IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ 
    description: 'Name of the team', 
    example: 'Frontend Development Team',
    type: 'string'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Description of the team', 
    example: 'Specialized team for React and TypeScript development',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'List of developer IDs to include in the team', 
    example: [
      '9b40fa98-55dd-4578-9df8-9761478730dd',
      '8c51eb09-66ee-4689-0ef9-0872589841ee'
    ],
    type: 'array',
    items: {
      type: 'string',
      format: 'uuid'
    }
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  developerIds: string[];
}
