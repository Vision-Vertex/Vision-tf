import { IsUUID, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateTeamDto } from './create-team.dto';
import { AssignmentStatus } from '@prisma/client';

export class CreateTeamAndAssignDto {
  @ApiProperty({ description: 'Job ID to assign the new team', example: 'uuid-job' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'New team information' })
  @ValidateNested()
  @Type(() => CreateTeamDto)
  team: CreateTeamDto;

  @ApiProperty({ description: 'User ID who assigns the team', example: 'uuid-admin' })
  @IsUUID()
  assignedBy: string;

  @ApiProperty({ enum: AssignmentStatus, description: 'Assignment status', example: AssignmentStatus.PENDING })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Notes for the assignment', example: 'Urgent assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}
