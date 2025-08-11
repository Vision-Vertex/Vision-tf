import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuspiciousActivityStatus } from '@prisma/client';

export class UpdateSuspiciousActivityDto {
  @ApiProperty({
    description: 'New status for the suspicious activity',
    example: 'RESOLVED',
    enum: SuspiciousActivityStatus,
    enumName: 'SuspiciousActivityStatus',
  })
  @IsEnum(SuspiciousActivityStatus)
  status: SuspiciousActivityStatus;

  @ApiPropertyOptional({
    description: 'Review notes or comments about the suspicious activity',
    example: 'This was a legitimate brute force attack test',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
