import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AssignmentStatsQueryDto {
  @ApiProperty({ 
    required: false,
    description: 'Filter by specific job ID',
    example: 'job-123'
  })
  @IsOptional()
  @IsUUID('4')
  jobId?: string;

  @ApiProperty({ 
    required: false,
    description: 'Filter by specific developer ID',
    example: 'dev-123'
  })
  @IsOptional()
  @IsUUID('4')
  developerId?: string;

  @ApiProperty({ 
    required: false,
    description: 'Filter by assignments from this date (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiProperty({ 
    required: false,
    description: 'Filter by assignments until this date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  dateTo?: Date;
}
