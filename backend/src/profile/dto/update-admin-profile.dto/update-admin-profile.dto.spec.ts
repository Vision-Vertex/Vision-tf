import { validate } from 'class-validator';
import { plainToClass, Type } from 'class-transformer';
import { 
  NotificationSettingsDto, 
  AdminPreferencesDto, 
  UpdateAdminProfileDto, 
  AdminProfileDto, 
  ProfileFiltersDto, 
  ProfileStatisticsDto,
  RoleStatisticsDto,
  TimeSeriesDataDto,
  SkillStatisticsDto,
  GeographicStatisticsDto,
  ActivityStatisticsDto
} from './update-admin-profile.dto';
import { UserRole } from '@prisma/client';

describe('NotificationSettingsDto', () => {
  it('should validate valid notification settings', async () => {
    const dto = plainToClass(NotificationSettingsDto, {
      emailNotifications: true,
      systemAlerts: false,
      userReports: true,
      securityAlerts: true
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(NotificationSettingsDto, {
      emailNotifications: true
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid boolean values', async () => {
    const dto = plainToClass(NotificationSettingsDto, {
      emailNotifications: 'invalid'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('AdminPreferencesDto', () => {
  it('should validate valid admin preferences', async () => {
    const dto = plainToClass(AdminPreferencesDto, {
      dashboardLayout: 'compact',
      notificationSettings: {
        emailNotifications: true,
        systemAlerts: false
      },
      defaultTimezone: 'UTC'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(AdminPreferencesDto, {
      dashboardLayout: 'compact'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid notification settings', async () => {
    const dto = plainToClass(AdminPreferencesDto, {
      notificationSettings: {
        emailNotifications: 'invalid'
      }
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateAdminProfileDto', () => {
  it('should validate valid admin profile update', async () => {
    const dto = plainToClass(UpdateAdminProfileDto, {
      companyName: 'Vision-TF System',
      systemRole: 'SYSTEM_ADMIN',
      permissions: ['manage_users', 'edit_content'],
      lastSystemAccess: '2025-08-10T15:30:00Z',
      adminPreferences: {
        dashboardLayout: 'compact',
        notificationSettings: {
          emailNotifications: true
        }
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(UpdateAdminProfileDto, {
      companyName: 'Test Company'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid date string', async () => {
    const dto = plainToClass(UpdateAdminProfileDto, {
      lastSystemAccess: 'invalid-date'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid permissions array', async () => {
    const dto = plainToClass(UpdateAdminProfileDto, {
      permissions: 'not-an-array'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('AdminProfileDto', () => {
  it('should validate valid admin profile', async () => {
    const dto = plainToClass(AdminProfileDto, {
      id: 'uuid-string',
      userId: 'user-uuid',
      displayName: 'John Admin',
      bio: 'System administrator',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      chatLastReadAt: '2025-08-10T15:30:00Z',
      skills: ['JavaScript', 'React'],
      experience: 5,
      companyName: 'Vision-TF System',
      email: 'admin@vision-tf.com',
      username: 'admin_user',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      status: 'active'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(AdminProfileDto, {
      displayName: 'John Admin'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid user role', async () => {
    const dto = plainToClass(AdminProfileDto, {
      role: 'INVALID_ROLE'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid email verification status', async () => {
    const dto = plainToClass(AdminProfileDto, {
      isEmailVerified: 'not-boolean'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ProfileFiltersDto', () => {
  it('should validate valid profile filters', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      search: 'john',
      role: UserRole.DEVELOPER,
      isEmailVerified: true,
      status: 'active',
      companyName: 'Vision-TF',
      systemRole: 'SYSTEM_ADMIN',
      hasPermission: 'manage_users',
      hasPermissions: ['manage_users', 'edit_content'],
      createdAtFrom: '2025-01-01T00:00:00Z',
      createdAtTo: '2025-12-31T23:59:59Z',
      hasSkills: ['JavaScript', 'React'],
      minExperience: 3,
      maxExperience: 10,
      isAvailable: true,
      remoteWork: true,
      timezone: 'UTC+3',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal filters', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      search: 'john'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform string boolean values correctly', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      isEmailVerified: 'true',
      isAvailable: 'false',
      remoteWork: 'true'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.isEmailVerified).toBe(true);
    expect(dto.isAvailable).toBe(false);
    expect(dto.remoteWork).toBe(true);
  });

  it('should transform string arrays correctly', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      hasPermissions: 'manage_users,edit_content,view_analytics',
      hasSkills: 'JavaScript,React,Node.js'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.hasPermissions).toEqual(['manage_users', 'edit_content', 'view_analytics']);
    expect(dto.hasSkills).toEqual(['JavaScript', 'React', 'Node.js']);
  });

  it('should transform numeric values correctly', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      minExperience: '5',
      maxExperience: '10',
      page: '2',
      limit: '50'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.minExperience).toBe(5);
    expect(dto.maxExperience).toBe(10);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('should fail with invalid sort field', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      sortBy: 'invalid_field'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid sort order', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      sortOrder: 'invalid'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should enforce page limits', async () => {
    const dto = plainToClass(ProfileFiltersDto, {
      page: 0,
      limit: 150
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1); // Should default to 1
    expect(dto.limit).toBe(100); // Should cap at 100
  });
});

describe('ProfileStatisticsDto', () => {
  it('should validate valid profile statistics', async () => {
    const dto = plainToClass(ProfileStatisticsDto, {
      totalProfiles: 250,
      activeProfiles: 200,
      verifiedProfiles: 180,
      roleStatistics: [
        {
          role: UserRole.DEVELOPER,
          totalCount: 150,
          activeCount: 120,
          verifiedCount: 100,
          percentage: 60.5
        }
      ],
      registrationTrend: [
        {
          date: '2025-01-01',
          count: 25,
          roleCounts: { [UserRole.DEVELOPER]: 15, [UserRole.CLIENT]: 10 }
        }
      ],
      topSkills: [
        {
          skill: 'JavaScript',
          count: 45,
          percentage: 30.0
        }
      ],
      geographicDistribution: [
        {
          timezone: 'UTC+3',
          count: 25,
          percentage: 10.0
        }
      ],
      activityStatistics: {
        last24Hours: 45,
        last7Days: 120,
        last30Days: 180,
        last90Days: 200
      },
      averageCompletionRate: 85.5,
      profilesThisMonth: 25,
      profilesUpdatedThisMonth: 45,
      growthRate: 15.5,
      dateRange: '2025-01-01 to 2025-12-31',
      lastUpdated: '2025-08-10T15:30:00Z'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal statistics', async () => {
    const dto = plainToClass(ProfileStatisticsDto, {
      totalProfiles: 100
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('RoleStatisticsDto', () => {
  it('should validate valid role statistics', async () => {
    const dto = plainToClass(RoleStatisticsDto, {
      role: UserRole.DEVELOPER,
      totalCount: 150,
      activeCount: 120,
      verifiedCount: 100,
      percentage: 60.5
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(RoleStatisticsDto, {
      role: UserRole.DEVELOPER,
      totalCount: 150
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid role', async () => {
    const dto = plainToClass(RoleStatisticsDto, {
      role: 'INVALID_ROLE'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid number values', async () => {
    const dto = plainToClass(RoleStatisticsDto, {
      totalCount: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('TimeSeriesDataDto', () => {
  it('should validate valid time series data', async () => {
    const dto = plainToClass(TimeSeriesDataDto, {
      date: '2025-01-01',
      count: 25,
      roleCounts: { [UserRole.DEVELOPER]: 15, [UserRole.CLIENT]: 10 }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(TimeSeriesDataDto, {
      date: '2025-01-01',
      count: 25
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid date format', async () => {
    const dto = plainToClass(TimeSeriesDataDto, {
      date: 'invalid-date',
      count: 25
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid count', async () => {
    const dto = plainToClass(TimeSeriesDataDto, {
      date: '2025-01-01',
      count: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SkillStatisticsDto', () => {
  it('should validate valid skill statistics', async () => {
    const dto = plainToClass(SkillStatisticsDto, {
      skill: 'JavaScript',
      count: 45,
      percentage: 30.0
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(SkillStatisticsDto, {
      skill: 'JavaScript',
      count: 45
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate without skill since it is optional', async () => {
    const dto = plainToClass(SkillStatisticsDto, {
      count: 45,
      percentage: 30.0
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid count', async () => {
    const dto = plainToClass(SkillStatisticsDto, {
      skill: 'JavaScript',
      count: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('GeographicStatisticsDto', () => {
  it('should validate valid geographic statistics', async () => {
    const dto = plainToClass(GeographicStatisticsDto, {
      timezone: 'UTC+3',
      count: 25,
      percentage: 10.0
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(GeographicStatisticsDto, {
      timezone: 'UTC+3',
      count: 25
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate without timezone since it is optional', async () => {
    const dto = plainToClass(GeographicStatisticsDto, {
      count: 25,
      percentage: 10.0
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid count', async () => {
    const dto = plainToClass(GeographicStatisticsDto, {
      timezone: 'UTC+3',
      count: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ActivityStatisticsDto', () => {
  it('should validate valid activity statistics', async () => {
    const dto = plainToClass(ActivityStatisticsDto, {
      last24Hours: 45,
      last7Days: 120,
      last30Days: 180,
      last90Days: 200
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(ActivityStatisticsDto, {
      last24Hours: 45,
      last7Days: 120
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid number values', async () => {
    const dto = plainToClass(ActivityStatisticsDto, {
      last24Hours: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate with zero values', async () => {
    const dto = plainToClass(ActivityStatisticsDto, {
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      last90Days: 0
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});


