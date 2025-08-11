import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class ChangeUserRoleDto {
  @ApiProperty({
    description: 'User ID to change role for',
    example: 'e33eab6b-e559-417d-aa99-d606cb7b9ed4',
    format: 'uuid',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'New role to assign to the user',
    example: 'DEVELOPER',
    enum: UserRole,
    enumName: 'UserRole',
  })
  @IsEnum(UserRole)
  newRole: UserRole;
}
