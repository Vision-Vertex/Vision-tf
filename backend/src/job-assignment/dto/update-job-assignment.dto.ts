import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';
import { CreateJobAssignmentDto } from './create-job-assignment.dto';

export class UpdateJobAssignmentDto extends PartialType(CreateJobAssignmentDto) {
  @ApiProperty({ enum: AssignmentStatus, description: 'Assignment status', example: AssignmentStatus.IN_PROGRESS, required: false })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}
