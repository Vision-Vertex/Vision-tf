// src/job-assignment/dto/developer-suggestion.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DeveloperSuggestionDto {
  @ApiProperty({ description: 'Developer ID', example: 'uuid-dev-123' })
  id: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstname: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastname: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Array of skills', example: ['JavaScript', 'NestJS'] })
  skills: string[];
}
