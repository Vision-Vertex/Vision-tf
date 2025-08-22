import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssignTeamDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  teamId: string;

  @IsUUID()
  assignedBy: string; // the user who assigns the team

  @IsOptional()
  @IsString()
  notes?: string;
}
