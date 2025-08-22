import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class UpdateTeamAssignmentStatusDto {
  @ApiProperty({ description: 'Team assignment ID', example: 'uuid-team-assignment' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: AssignmentStatus, description: 'New assignment status', example: AssignmentStatus.IN_PROGRESS })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}
