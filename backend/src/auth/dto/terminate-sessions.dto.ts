import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TerminateSessionsDto {
  @ApiPropertyOptional({
    description:
      'Specific session token to terminate (if not provided, all sessions will be terminated)',
    example: 'session-token-123',
  })
  @IsOptional()
  @IsString()
  sessionToken?: string;
}
