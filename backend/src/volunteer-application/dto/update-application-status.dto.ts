import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class UpdateApplicationStatusDto {
  @ApiProperty({ 
    description: 'New application status', 
    enum: ApplicationStatus,
    example: ApplicationStatus.UNDER_REVIEW
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ 
    description: 'Reason for status change',
    example: 'Application meets requirements'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes',
    example: 'Developer has strong React experience'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
