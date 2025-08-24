import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignTeamDto {
  @ApiProperty({ 
    description: 'Job ID to assign the team to', 
    example: 'fe8cfded-9d06-4053-86d4-f0a85072215c',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  jobId: string;

  @ApiProperty({ 
    description: 'Team ID to assign to the job', 
    example: 'a9a6c2fa-72aa-487c-99ed-5ab326a68f88',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  teamId: string;

  @ApiProperty({ 
    description: 'User ID who is assigning the team', 
    example: '4310788c-c88c-4656-815c-b71dd78ad37c',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  assignedBy: string;

  @ApiPropertyOptional({ 
    description: 'Optional notes about the team assignment', 
    example: 'Urgent team assignment for high-priority project',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
