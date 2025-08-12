import { IsString, IsOptional, IsArray, IsDateString, IsBoolean, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Email notifications enabled', example: true })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'System alerts enabled', example: true })
  @IsBoolean()
  @IsOptional()
  systemAlerts?: boolean;

  @ApiPropertyOptional({ description: 'User reports enabled', example: true })
  @IsBoolean()
  @IsOptional()
  userReports?: boolean;

  @ApiPropertyOptional({ description: 'Security alerts enabled', example: true })
  @IsBoolean()
  @IsOptional()
  securityAlerts?: boolean;
}

class AdminPreferencesDto {
  @ApiPropertyOptional({ description: 'Dashboard layout preference', example: 'compact' })
  @IsString()
  @IsOptional()
  dashboardLayout?: string;

  @ApiPropertyOptional({ type: NotificationSettingsDto, description: 'Notification settings' })
  @ValidateNested()
  @IsOptional()
  notificationSettings?: NotificationSettingsDto;

  @ApiPropertyOptional({ description: 'Default timezone', example: 'UTC' })
  @IsString()
  @IsOptional()
  defaultTimezone?: string;
}

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Vision-TF System' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: 'System role', example: 'SYSTEM_ADMIN' })
  @IsString()
  @IsOptional()
  systemRole?: string;

  @ApiPropertyOptional({ description: 'Permissions list', example: ['manage_users', 'edit_content'] })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Last system access timestamp', example: '2025-08-10T15:30:00Z' })
  @IsDateString()
  @IsOptional()
  lastSystemAccess?: string;

  @ApiPropertyOptional({ type: AdminPreferencesDto, description: 'Admin preferences' })
  @ValidateNested()
  @IsOptional()
  adminPreferences?: AdminPreferencesDto;
}
