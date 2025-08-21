import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ enum: AssignmentStatus, description: 'New status for assignment', example: AssignmentStatus.IN_PROGRESS })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}
