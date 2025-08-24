import { IsUUID, IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class CreateJobAssignmentDto {
  @ApiProperty({ description: 'Job ID to assign', example: 'uuid-job' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Developer ID who is assigned', example: 'uuid-dev' })
  @IsUUID()
  developerId: string;

  @ApiProperty({ description: 'User ID who assigns the job', example: 'uuid-admin' })
  @IsUUID()
  assignedBy: string;

  @ApiProperty({ description: 'Assignment type', example: 'manual' })
  @IsString()
  @IsNotEmpty()
  assignmentType: string;

  // Status is automatically set to PENDING when creating a new assignment
  // No need to include it in the DTO

  @ApiPropertyOptional({ description: 'Notes for the assignment', example: 'Urgent assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}
