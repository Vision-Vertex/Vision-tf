import { IsUUID, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateTeamDto } from './create-team.dto';
import { AssignmentStatus } from '@prisma/client';

export class CreateTeamAndAssignDto {
  @ApiProperty({ 
    description: 'Job ID to assign the new team', 
    example: 'fe8cfded-9d06-4053-86d4-f0a85072215c',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  jobId: string;

  @ApiProperty({ 
    description: 'New team information',
    example: {
      name: 'Frontend Development Team',
      description: 'Specialized team for React and TypeScript development',
      developerIds: [
        '9b40fa98-55dd-4578-9df8-9761478730dd',
        '8c51eb09-66ee-4689-0ef9-0872589841ee'
      ]
    }
  })
  @ValidateNested()
  @Type(() => CreateTeamDto)
  team: CreateTeamDto;

  @ApiProperty({ 
    description: 'User ID who assigns the team', 
    example: '4310788c-c88c-4656-815c-b71dd78ad37c',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  assignedBy: string;

  @ApiPropertyOptional({ 
    description: 'Notes for the assignment', 
    example: 'Urgent team assignment for high-priority frontend project',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
