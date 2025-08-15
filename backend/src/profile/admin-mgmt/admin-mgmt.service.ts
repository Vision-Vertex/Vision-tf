import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminProfileDto, ProfileFiltersDto, ProfileStatisticsDto } from '../dto/update-admin-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminMgmtService {
  constructor(private prisma: PrismaService) {}

  async getAllProfiles(filters: ProfileFiltersDto = {}) {
    const {
      search,
      role,
      isEmailVerified,
      status,
      companyName,
      systemRole,
      hasPermission,
      hasPermissions,
      createdAtFrom,
      createdAtTo,
      updatedAtFrom,
      updatedAtTo,
      lastSystemAccessFrom,
      lastSystemAccessTo,
      hasSkills,
      minExperience,
      maxExperience,
      isAvailable,
      remoteWork,
      timezone,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Build where conditions
    const where: any = {};

    // Search condition
    if (search && search.trim()) {
      where.OR = [
        { user: { firstname: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { lastname: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { username: { contains: search.trim(), mode: 'insensitive' } } },
        { displayName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Role conditions
    if (role) {
      where.user = { ...where.user, role };
    }

    // Email verification
    if (isEmailVerified !== undefined) {
      where.user = { ...where.user, isEmailVerified };
    }

    // Status (using isDeleted from user table)
    if (status) {
      where.user = { ...where.user, isDeleted: status === 'deleted' };
    }

    // Company name
    if (companyName && companyName.trim()) {
      where.companyName = { contains: companyName.trim(), mode: 'insensitive' };
    }

    // System role
    if (systemRole && systemRole.trim()) {
      where.systemRole = { contains: systemRole.trim(), mode: 'insensitive' };
    }

    // Permissions (array field)
    if (hasPermission && hasPermission.trim()) {
      where.permissions = { has: hasPermission.trim() };
    } else if (hasPermissions && hasPermissions.length > 0) {
      const validPermissions = hasPermissions.filter(p => p && p.trim());
      if (validPermissions.length > 0) {
        where.permissions = { hasEvery: validPermissions };
      }
    }

    // Date ranges with validation
    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) {
        const fromDate = new Date(createdAtFrom);
        if (!isNaN(fromDate.getTime())) {
          where.createdAt.gte = fromDate;
        }
      }
      if (createdAtTo) {
        const toDate = new Date(createdAtTo);
        if (!isNaN(toDate.getTime())) {
          where.createdAt.lte = toDate;
        }
      }
    }

    if (updatedAtFrom || updatedAtTo) {
      where.updatedAt = {};
      if (updatedAtFrom) {
        const fromDate = new Date(updatedAtFrom);
        if (!isNaN(fromDate.getTime())) {
          where.updatedAt.gte = fromDate;
        }
      }
      if (updatedAtTo) {
        const toDate = new Date(updatedAtTo);
        if (!isNaN(toDate.getTime())) {
          where.updatedAt.lte = toDate;
        }
      }
    }

    if (lastSystemAccessFrom || lastSystemAccessTo) {
      where.lastSystemAccess = {};
      if (lastSystemAccessFrom) {
        const fromDate = new Date(lastSystemAccessFrom);
        if (!isNaN(fromDate.getTime())) {
          where.lastSystemAccess.gte = fromDate;
        }
      }
      if (lastSystemAccessTo) {
        const toDate = new Date(lastSystemAccessTo);
        if (!isNaN(toDate.getTime())) {
          where.lastSystemAccess.lte = toDate;
        }
      }
    }

    // Skills (array field)
    if (hasSkills && hasSkills.length > 0) {
      const validSkills = hasSkills.filter(skill => skill && skill.trim());
      if (validSkills.length > 0) {
        where.skills = { hasEvery: validSkills };
      }
    }

    // Experience (numeric field)
    if (minExperience !== undefined || maxExperience !== undefined) {
      where.experience = {};
      if (minExperience !== undefined && minExperience >= 0) {
        where.experience.gte = minExperience;
      }
      if (maxExperience !== undefined && maxExperience >= 0) {
        where.experience.lte = maxExperience;
      }
    }

    // Availability (JSON field) - only filter if the field exists and has the expected structure
    if (isAvailable !== undefined) {
      where.availability = {
        not: null,
        path: ['available'],
        equals: isAvailable,
      };
    }

    // Work preferences (JSON field) - only filter if the field exists and has the expected structure
    if (remoteWork !== undefined) {
      where.workPreferences = {
        not: null,
        path: ['remoteWork'],
        equals: remoteWork,
      };
    }

    // Timezone (JSON field) - only filter if the field exists and has the expected structure
    if (timezone && timezone.trim()) {
      where.availability = {
        not: null,
        path: ['timezone'],
        equals: timezone.trim(),
      };
    }

    // Calculate pagination
    const skip = (validPage - 1) * validLimit;

    // Build order by - handle nested fields properly
    const orderBy: any = {};
    
    // Handle sorting by user fields
    if (sortBy === 'email' || sortBy === 'username' || sortBy === 'role' || sortBy === 'isEmailVerified' || 
        sortBy === 'firstname' || sortBy === 'lastname') {
      orderBy.user = { [sortBy]: sortOrder };
    } else {
      // For profile fields, use direct field name
      // Validate that the sort field exists in the profile schema
      const validProfileSortFields = [
        'createdAt', 'updatedAt', 'displayName', 'companyName', 'systemRole', 
        'experience', 'lastSystemAccess', 'hourlyRate', 'industry'
      ];
      
      if (validProfileSortFields.includes(sortBy)) {
        orderBy[sortBy] = sortOrder;
      } else {
        // Default to createdAt if invalid sort field
        orderBy.createdAt = sortOrder;
      }
    }

    // Execute query
    const [profiles, totalCount] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              username: true,
              role: true,
              isEmailVerified: true,
              isDeleted: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: validLimit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    // Transform data to match AdminProfileDto
    const transformedProfiles = profiles.map(profile => ({
      userId: profile.userId,
      displayName: profile.displayName,
      email: profile.user.email,
      username: profile.user.username,
      role: profile.user.role,
      companyName: profile.companyName,
      systemRole: profile.systemRole,
      permissions: profile.permissions,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      isEmailVerified: profile.user.isEmailVerified,
      status: profile.user.isDeleted ? 'deleted' : 'active',
      adminPreferences: profile.adminPreferences,
      systemAccess: {
        lastSystemAccess: profile.lastSystemAccess?.toISOString(),
      },
      profilePictureUrl: profile.profilePictureUrl,
      bio: profile.bio,
    }));

    return {
      profiles: transformedProfiles,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
        hasNext: validPage * validLimit < totalCount,
        hasPrev: validPage > 1,
      },
    };
  }

  async getProfileByUserId(userId: string): Promise<AdminProfileDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            username: true,
            role: true,
            isEmailVerified: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName || undefined,
      bio: profile.bio || undefined,
      profilePictureUrl: profile.profilePictureUrl || undefined,
      chatLastReadAt: profile.chatLastReadAt?.toISOString(),
      skills: profile.skills || [],
      experience: profile.experience || undefined,
      availability: profile.availability,
      companyName: profile.companyName || undefined,
      companyWebsite: profile.companyWebsite || undefined,
      companyDescription: profile.companyDescription || undefined,
      companySize: profile.companySize || undefined,
      contactEmail: profile.contactEmail || undefined,
      contactPerson: profile.contactPerson || undefined,
      contactPhone: profile.contactPhone || undefined,
      currency: profile.currency || undefined,
      education: profile.education,
      hourlyRate: profile.hourlyRate || undefined,
      industry: profile.industry || undefined,
      lastSystemAccess: profile.lastSystemAccess?.toISOString(),
      location: profile.location,
      permissions: profile.permissions || [],
      projectPreferences: profile.projectPreferences,
      socialLinks: profile.socialLinks,
      systemRole: profile.systemRole || undefined,
      workPreferences: profile.workPreferences,
      portfolioLinks: profile.portfolioLinks,
      billingAddress: profile.billingAddress,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      // User fields (from User relation)
      email: profile.user.email,
      username: profile.user.username,
      role: profile.user.role,
      isEmailVerified: profile.user.isEmailVerified,
      status: profile.user.isDeleted ? 'deleted' : 'active',
      // Admin-specific preferences
      adminPreferences: profile.adminPreferences as any,
    };
  }

  async getProfileStatistics(): Promise<ProfileStatisticsDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalProfiles,
      activeProfiles,
      verifiedProfiles,
      profilesThisMonth,
      profilesUpdatedThisMonth,
    ] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({
        where: {
          user: { isDeleted: false },
        },
      }),
      this.prisma.profile.count({
        where: {
          user: { isEmailVerified: true },
        },
      }),
      this.prisma.profile.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.profile.count({
        where: {
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Get role statistics
    const roleStats = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
      where: {
        isDeleted: false,
      },
    });

    const roleStatistics = roleStats.map(stat => ({
      role: stat.role,
      totalCount: stat._count.id,
      activeCount: stat._count.id, // Assuming all non-deleted are active
      verifiedCount: 0, // Would need separate query
      percentage: (stat._count.id / totalProfiles) * 100,
    }));

    // Get verified counts by role
    const verifiedRoleStats = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
      where: {
        isEmailVerified: true,
        isDeleted: false,
      },
    });

    // Update verified counts
    verifiedRoleStats.forEach(stat => {
      const roleStat = roleStatistics.find(rs => rs.role === stat.role);
      if (roleStat) {
        roleStat.verifiedCount = stat._count.id;
      }
    });

    // Get registration trend (last 30 days)
    const registrationTrend = await this.prisma.profile.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const registrationTrendData = registrationTrend.map(stat => ({
      date: stat.createdAt.toISOString().split('T')[0],
      count: stat._count.id,
      roleCounts: {}, // Would need separate query for role breakdown
    }));

    // Get activity trend (last 30 days)
    const activityTrend = await this.prisma.profile.groupBy({
      by: ['updatedAt'],
      _count: {
        id: true,
      },
      where: {
        updatedAt: { gte: thirtyDaysAgo },
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });

    const activityTrendData = activityTrend.map(stat => ({
      date: stat.updatedAt.toISOString().split('T')[0],
      count: stat._count.id,
      roleCounts: {}, // Would need separate query for role breakdown
    }));

         // Get top skills (for developers)
     const developerProfiles = await this.prisma.profile.findMany({
       where: {
         user: { role: UserRole.DEVELOPER },
         skills: { isEmpty: false },
       },
       select: { skills: true },
     });

    const skillCounts: Record<string, number> = {};
    developerProfiles.forEach(profile => {
      if (profile.skills) {
        profile.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: (count / developerProfiles.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

         // Get geographic distribution (by timezone)
     const timezoneProfiles = await this.prisma.profile.findMany({
       where: {
         availability: { not: { equals: null } },
       },
       select: { availability: true },
     });

    const timezoneCounts: Record<string, number> = {};
    timezoneProfiles.forEach(profile => {
      if (profile.availability && typeof profile.availability === 'object') {
        const timezone = (profile.availability as any).timezone;
        if (timezone) {
          timezoneCounts[timezone] = (timezoneCounts[timezone] || 0) + 1;
        }
      }
    });

    const geographicDistribution = Object.entries(timezoneCounts)
      .map(([timezone, count]) => ({
        timezone,
        count,
        percentage: (count / totalProfiles) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Activity statistics
    const activityStatistics = {
      last24Hours: 0, // Would need separate tracking
      last7Days: 0, // Would need separate tracking
      last30Days: 0, // Would need separate tracking
      last90Days: 0, // Would need separate tracking
    };

    // Calculate growth rate (simplified)
    const lastMonthProfiles = await this.prisma.profile.count({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
      },
    });

    const growthRate = lastMonthProfiles > 0 
      ? ((profilesThisMonth - lastMonthProfiles) / lastMonthProfiles) * 100 
      : 0;

    return {
      totalProfiles,
      activeProfiles,
      verifiedProfiles,
      roleStatistics,
      registrationTrend: registrationTrendData,
      activityTrend: activityTrendData,
      topSkills,
      geographicDistribution,
      activityStatistics,
      averageCompletionRate: 85.5, // Would need calculation based on profile completeness
      profilesThisMonth,
      profilesUpdatedThisMonth,
      growthRate,
      dateRange: `${thirtyDaysAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
      lastUpdated: now.toISOString(),
    };
  }

  async getProfileAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get detailed analytics
    const [
      totalUsers,
      newUsersThisMonth,
      activeUsersThisMonth,
      userEngagement,
      profileCompletionRates,
      skillDistribution,
      availabilityStats,
      workPreferenceStats,
    ] = await Promise.all([
      // Total users
      this.prisma.user.count({ where: { isDeleted: false } }),

      // New users this month
      this.prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          isDeleted: false,
        },
      }),

      // Active users this month (updated profiles)
      this.prisma.profile.count({
        where: {
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),

      // User engagement (profiles with recent activity)
      this.prisma.profile.count({
        where: {
          OR: [
            { updatedAt: { gte: thirtyDaysAgo } },
            { lastSystemAccess: { gte: thirtyDaysAgo } },
          ],
        },
      }),

      // Profile completion rates by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: { isDeleted: false },
      }),

             // Skill distribution
       this.prisma.profile.findMany({
         where: {
           user: { role: UserRole.DEVELOPER },
           skills: { isEmpty: false },
         },
         select: { skills: true },
       }),

       // Availability statistics
       this.prisma.profile.findMany({
         where: {
           availability: { not: { equals: null } },
         },
         select: { availability: true },
       }),

       // Work preference statistics
       this.prisma.profile.findMany({
         where: {
           workPreferences: { not: { equals: null } },
         },
         select: { workPreferences: true },
       }),
    ]);

    // Calculate skill distribution
    const skillCounts: Record<string, number> = {};
    skillDistribution.forEach(profile => {
      if (profile.skills) {
        profile.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    // Calculate availability statistics
    const availabilityStatsData = {
      available: 0,
      unavailable: 0,
      notSet: 0,
    };

    availabilityStats.forEach(profile => {
      if (profile.availability && typeof profile.availability === 'object') {
        const available = (profile.availability as any).available;
        if (available === true) {
          availabilityStatsData.available++;
        } else if (available === false) {
          availabilityStatsData.unavailable++;
        } else {
          availabilityStatsData.notSet++;
        }
      } else {
        availabilityStatsData.notSet++;
      }
    });

    // Calculate work preference statistics
    const workPrefStats = {
      remoteWork: 0,
      onSiteWork: 0,
      hybridWork: 0,
      notSet: 0,
    };

    workPreferenceStats.forEach(profile => {
      if (profile.workPreferences && typeof profile.workPreferences === 'object') {
        const prefs = profile.workPreferences as any;
        if (prefs.remoteWork) workPrefStats.remoteWork++;
        if (prefs.onSiteWork) workPrefStats.onSiteWork++;
        if (prefs.hybridWork) workPrefStats.hybridWork++;
      } else {
        workPrefStats.notSet++;
      }
    });

    // Calculate engagement rate
    const engagementRate = totalUsers > 0 ? (userEngagement / totalUsers) * 100 : 0;

    // Calculate growth rate
    const lastMonthUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
        isDeleted: false,
      },
    });

    const growthRate = lastMonthUsers > 0 
      ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 
      : 0;

    return {
      overview: {
        totalUsers,
        newUsersThisMonth,
        activeUsersThisMonth,
        userEngagement,
        engagementRate,
        growthRate,
      },
      skillDistribution: Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      availabilityStats: availabilityStatsData,
      workPreferenceStats: workPrefStats,
      roleDistribution: profileCompletionRates.map(stat => ({
        role: stat.role,
        count: stat._count.id,
        percentage: (stat._count.id / totalUsers) * 100,
      })),
      trends: {
        period: '30 days',
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      },
    };
  }
}
