import { IsString, IsOptional, IsArray, IsDateString, IsBoolean, ValidateNested, IsEnum, IsNumber, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

// Notification Settings DTO
export class NotificationSettingsDto {
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

// Admin Preferences DTO
export class AdminPreferencesDto {
  @ApiPropertyOptional({ description: 'Dashboard layout preference', example: 'compact' })
  @IsString()
  @IsOptional()
  dashboardLayout?: string;

  @ApiPropertyOptional({ type: NotificationSettingsDto, description: 'Notification settings' })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  @IsOptional()
  notificationSettings?: NotificationSettingsDto;

  @ApiPropertyOptional({ description: 'Default timezone', example: 'UTC' })
  @IsString()
  @IsOptional()
  defaultTimezone?: string;
}

// Update Admin Profile DTO
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
  @Type(() => AdminPreferencesDto)
  @IsOptional()
  adminPreferences?: AdminPreferencesDto;
}

// Admin Profile DTO
export class AdminProfileDto {
  // Profile fields (from Profile model)
  @ApiPropertyOptional({ description: 'Profile ID', example: 'uuid-string' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ description: 'User ID', example: 'uuid-string' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Admin' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Bio or description', example: 'System administrator with full access rights' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL', example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: 'Chat last read timestamp', example: '2025-08-10T15:30:00Z' })
  @IsDateString()
  @IsOptional()
  chatLastReadAt?: string;

  @ApiPropertyOptional({ description: 'Skills list', example: ['JavaScript', 'React', 'Node.js'] })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ description: 'Experience in years', example: 5 })
  @IsNumber()
  @IsOptional()
  experience?: number;

  @ApiPropertyOptional({ description: 'Availability settings', example: { available: true, timezone: 'UTC+3' } })
  @IsOptional()
  availability?: any;

  @ApiPropertyOptional({ description: 'Company name', example: 'Vision-TF System' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Company website', example: 'https://vision-tf.com' })
  @IsString()
  @IsOptional()
  companyWebsite?: string;

  @ApiPropertyOptional({ description: 'Company description', example: 'Leading technology solutions provider' })
  @IsString()
  @IsOptional()
  companyDescription?: string;

  @ApiPropertyOptional({ description: 'Company size', example: '50-100 employees' })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@vision-tf.com' })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact person', example: 'John Doe' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+1234567890' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Education information', example: { degree: 'BS Computer Science', university: 'MIT' } })
  @IsOptional()
  education?: any;

  @ApiPropertyOptional({ description: 'Hourly rate', example: 75.50 })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Industry', example: 'Technology' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Last system access timestamp', example: '2025-08-10T15:30:00Z' })
  @IsDateString()
  @IsOptional()
  lastSystemAccess?: string;

  @ApiPropertyOptional({ description: 'Location information', example: { city: 'New York', country: 'USA' } })
  @IsOptional()
  location?: any;

  @ApiPropertyOptional({ description: 'Permissions list', example: ['manage_users', 'edit_content', 'view_analytics'] })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Project preferences', example: { projectTypes: ['web', 'mobile'], duration: '3-6 months' } })
  @IsOptional()
  projectPreferences?: any;

  @ApiPropertyOptional({ description: 'Social links', example: { linkedin: 'https://linkedin.com/in/johndoe', github: 'https://github.com/johndoe' } })
  @IsOptional()
  socialLinks?: any;

  @ApiPropertyOptional({ description: 'System role', example: 'SYSTEM_ADMIN' })
  @IsString()
  @IsOptional()
  systemRole?: string;

  @ApiPropertyOptional({ description: 'Work preferences', example: { remoteWork: true, travelWillingness: 'low' } })
  @IsOptional()
  workPreferences?: any;

  @ApiPropertyOptional({ description: 'Portfolio links', example: ['https://portfolio.com', 'https://behance.net/johndoe'] })
  @IsOptional()
  portfolioLinks?: any;

  @ApiPropertyOptional({ description: 'Billing address', example: { street: '123 Main St', city: 'New York', zip: '10001' } })
  @IsOptional()
  billingAddress?: any;

  @ApiPropertyOptional({ description: 'Profile creation date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @ApiPropertyOptional({ description: 'Profile last update date', example: '2025-08-10T15:30:00Z' })
  @IsDateString()
  @IsOptional()
  updatedAt?: string;

  // User fields (from User relation)
  @ApiPropertyOptional({ description: 'Email address', example: 'admin@vision-tf.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Username', example: 'admin_user' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'User role', enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Email verification status', example: true })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Account status', example: 'active' })
  @IsString()
  @IsOptional()
  status?: string;

  // Admin-specific preferences (stored in adminPreferences JSON field)
  @ApiPropertyOptional({ type: AdminPreferencesDto, description: 'Admin preferences' })
  @ValidateNested()
  @Type(() => AdminPreferencesDto)
  @IsOptional()
  adminPreferences?: AdminPreferencesDto;
}

// Profile Filters DTO
export class ProfileFiltersDto {
  @ApiPropertyOptional({ description: 'Search term for display name, email, or username', example: 'john' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by user role', enum: UserRole, example: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by email verification status', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by account status', example: 'active' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by company name', example: 'Vision-TF' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Filter by system role', example: 'SYSTEM_ADMIN' })
  @IsString()
  @IsOptional()
  systemRole?: string;

  @ApiPropertyOptional({ description: 'Filter by specific permission', example: 'manage_users' })
  @IsString()
  @IsOptional()
  hasPermission?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple permissions', example: ['manage_users', 'edit_content'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return value;
  })
  hasPermissions?: string[];

  @ApiPropertyOptional({ description: 'Filter by creation date (from)', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  createdAtFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (to)', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  createdAtTo?: string;

  @ApiPropertyOptional({ description: 'Filter by last update date (from)', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  updatedAtFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by last update date (to)', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  updatedAtTo?: string;

  @ApiPropertyOptional({ description: 'Filter by last system access (from)', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  lastSystemAccessFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by last system access (to)', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  lastSystemAccessTo?: string;

  @ApiPropertyOptional({ description: 'Filter by skills (for developers)', example: ['JavaScript', 'React'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return value;
  })
  hasSkills?: string[];

  @ApiPropertyOptional({ description: 'Filter by minimum experience years (for developers)', example: 3 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  minExperience?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum experience years (for developers)', example: 10 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  maxExperience?: number;

  @ApiPropertyOptional({ description: 'Filter by availability status (for developers)', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by remote work preference (for developers)', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  remoteWork?: boolean;

  @ApiPropertyOptional({ description: 'Filter by timezone', example: 'UTC+3' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ 
    description: 'Sort field', 
    example: 'createdAt',
    enum: [
      // Profile fields
      'createdAt', 'updatedAt', 'displayName', 'companyName', 'systemRole', 'experience', 'lastSystemAccess', 'hourlyRate', 'industry',
      // User fields
      'email', 'username', 'role', 'isEmailVerified', 'firstname', 'lastname'
    ]
  })
  @IsString()
  @IsOptional()
  @IsIn([
    // Profile fields
    'createdAt', 'updatedAt', 'displayName', 'companyName', 'systemRole', 'experience', 'lastSystemAccess', 'hourlyRate', 'industry',
    // User fields
    'email', 'username', 'role', 'isEmailVerified', 'firstname', 'lastname'
  ])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, minimum: 1 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 1;
    const num = Number(value);
    return isNaN(num) ? 1 : Math.max(1, num);
  })
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 20, minimum: 1, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 20;
    const num = Number(value);
    return isNaN(num) ? 20 : Math.min(100, Math.max(1, num));
  })
  limit?: number;
}

// Profile Statistics DTOs
export class RoleStatisticsDto {
  @ApiPropertyOptional({ description: 'User role', enum: UserRole, example: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Total count for this role', example: 150 })
  @IsNumber()
  @IsOptional()
  totalCount?: number;

  @ApiPropertyOptional({ description: 'Active count for this role', example: 120 })
  @IsNumber()
  @IsOptional()
  activeCount?: number;

  @ApiPropertyOptional({ description: 'Verified email count for this role', example: 100 })
  @IsNumber()
  @IsOptional()
  verifiedCount?: number;

  @ApiPropertyOptional({ description: 'Percentage of total users', example: 60.5 })
  @IsNumber()
  @IsOptional()
  percentage?: number;
}

export class TimeSeriesDataDto {
  @ApiPropertyOptional({ description: 'Date', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Count for this date', example: 25 })
  @IsNumber()
  @IsOptional()
  count?: number;

  @ApiPropertyOptional({ description: 'Role-specific count', example: { [UserRole.DEVELOPER]: 15, [UserRole.CLIENT]: 10 } })
  @IsOptional()
  roleCounts?: Record<string, number>;
}

export class SkillStatisticsDto {
  @ApiPropertyOptional({ description: 'Skill name', example: 'JavaScript' })
  @IsString()
  @IsOptional()
  skill?: string;

  @ApiPropertyOptional({ description: 'Number of developers with this skill', example: 45 })
  @IsNumber()
  @IsOptional()
  count?: number;

  @ApiPropertyOptional({ description: 'Percentage of developers with this skill', example: 30.0 })
  @IsNumber()
  @IsOptional()
  percentage?: number;
}

export class GeographicStatisticsDto {
  @ApiPropertyOptional({ description: 'Timezone or region', example: 'UTC+3' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Number of users in this timezone', example: 25 })
  @IsNumber()
  @IsOptional()
  count?: number;

  @ApiPropertyOptional({ description: 'Percentage of total users', example: 10.0 })
  @IsNumber()
  @IsOptional()
  percentage?: number;
}

export class ActivityStatisticsDto {
  @ApiPropertyOptional({ description: 'Users active in last 24 hours', example: 45 })
  @IsNumber()
  @IsOptional()
  last24Hours?: number;

  @ApiPropertyOptional({ description: 'Users active in last 7 days', example: 120 })
  @IsNumber()
  @IsOptional()
  last7Days?: number;

  @ApiPropertyOptional({ description: 'Users active in last 30 days', example: 180 })
  @IsNumber()
  @IsOptional()
  last30Days?: number;

  @ApiPropertyOptional({ description: 'Users active in last 90 days', example: 200 })
  @IsNumber()
  @IsOptional()
  last90Days?: number;
}

export class ProfileStatisticsDto {
  @ApiPropertyOptional({ description: 'Total number of profiles', example: 250 })
  @IsNumber()
  @IsOptional()
  totalProfiles?: number;

  @ApiPropertyOptional({ description: 'Total number of active profiles', example: 200 })
  @IsNumber()
  @IsOptional()
  activeProfiles?: number;

  @ApiPropertyOptional({ description: 'Total number of verified profiles', example: 180 })
  @IsNumber()
  @IsOptional()
  verifiedProfiles?: number;

  @ApiPropertyOptional({ description: 'Statistics by user role', type: [RoleStatisticsDto] })
  @IsArray()
  @IsOptional()
  roleStatistics?: RoleStatisticsDto[];

  @ApiPropertyOptional({ description: 'Registration trend over time', type: [TimeSeriesDataDto] })
  @IsArray()
  @IsOptional()
  registrationTrend?: TimeSeriesDataDto[];

  @ApiPropertyOptional({ description: 'Activity trend over time', type: [TimeSeriesDataDto] })
  @IsArray()
  @IsOptional()
  activityTrend?: TimeSeriesDataDto[];

  @ApiPropertyOptional({ description: 'Top skills among developers', type: [SkillStatisticsDto] })
  @IsArray()
  @IsOptional()
  topSkills?: SkillStatisticsDto[];

  @ApiPropertyOptional({ description: 'Geographic distribution by timezone', type: [GeographicStatisticsDto] })
  @IsArray()
  @IsOptional()
  geographicDistribution?: GeographicStatisticsDto[];

  @ApiPropertyOptional({ description: 'Activity statistics', type: ActivityStatisticsDto })
  @IsOptional()
  activityStatistics?: ActivityStatisticsDto;

  @ApiPropertyOptional({ description: 'Average profile completion rate', example: 85.5 })
  @IsNumber()
  @IsOptional()
  averageCompletionRate?: number;

  @ApiPropertyOptional({ description: 'Profiles created this month', example: 25 })
  @IsNumber()
  @IsOptional()
  profilesThisMonth?: number;

  @ApiPropertyOptional({ description: 'Profiles updated this month', example: 45 })
  @IsNumber()
  @IsOptional()
  profilesUpdatedThisMonth?: number;

  @ApiPropertyOptional({ description: 'Growth rate compared to last month (percentage)', example: 15.5 })
  @IsNumber()
  @IsOptional()
  growthRate?: number;

  @ApiPropertyOptional({ description: 'Date range for statistics', example: '2025-01-01 to 2025-12-31' })
  @IsString()
  @IsOptional()
  dateRange?: string;

  @ApiPropertyOptional({ description: 'Last updated timestamp', example: '2025-08-10T15:30:00Z' })
  @IsDateString()
  @IsOptional()
  lastUpdated?: string;
}
