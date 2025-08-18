import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminProfileDto,
  ProfileFiltersDto,
  ProfileStatisticsDto,
} from '../dto/update-admin-profile.dto';
import { UserRole } from '@prisma/client';
import { AuditService } from '../services/audit.service';
import { ProfileCompletionService } from '../services/profile-completion.service';
import {
  AdminUpdateDto,
  AdminUpdateResponseDto,
} from '../dto/admin-update.dto/admin-update.dto';

@Injectable()
export class AdminMgmtService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private completionService: ProfileCompletionService,
  ) {}

  async getAllProfiles(
    filters: ProfileFiltersDto = {},
    adminUserId?: string,
    cursor?: string,
  ) {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }

      // Validate filters object
      if (filters && typeof filters !== 'object') {
        throw new BadRequestException('Invalid filters parameter');
      }

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

      // Build optimized where conditions with database-level filtering
      const where: any = {};

      // Search condition
      if (search && search.trim()) {
        where.OR = [
          {
            user: {
              firstname: { contains: search.trim(), mode: 'insensitive' },
            },
          },
          {
            user: {
              lastname: { contains: search.trim(), mode: 'insensitive' },
            },
          },
          { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
          {
            user: {
              username: { contains: search.trim(), mode: 'insensitive' },
            },
          },
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
        where.companyName = {
          contains: companyName.trim(),
          mode: 'insensitive',
        };
      }

      // System role
      if (systemRole && systemRole.trim()) {
        where.systemRole = { contains: systemRole.trim(), mode: 'insensitive' };
      }

      // Permissions (array field)
      if (hasPermission && hasPermission.trim()) {
        where.permissions = { has: hasPermission.trim() };
      } else if (hasPermissions && hasPermissions.length > 0) {
        const validPermissions = hasPermissions.filter((p) => p && p.trim());
        if (validPermissions.length > 0) {
          where.permissions = { hasEvery: validPermissions };
        }
      }

      // Date ranges with validation
      if (createdAtFrom || createdAtTo) {
        where.createdAt = {};
        if (createdAtFrom) {
          const fromDate = new Date(createdAtFrom);
          if (isNaN(fromDate.getTime())) {
            throw new BadRequestException('Invalid createdAtFrom date format');
          }
          where.createdAt.gte = fromDate;
        }
        if (createdAtTo) {
          const toDate = new Date(createdAtTo);
          if (isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid createdAtTo date format');
          }
          where.createdAt.lte = toDate;
        }
      }

      if (updatedAtFrom || updatedAtTo) {
        where.updatedAt = {};
        if (updatedAtFrom) {
          const fromDate = new Date(updatedAtFrom);
          if (isNaN(fromDate.getTime())) {
            throw new BadRequestException('Invalid updatedAtFrom date format');
          }
          where.updatedAt.gte = fromDate;
        }
        if (updatedAtTo) {
          const toDate = new Date(updatedAtTo);
          if (isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid updatedAtTo date format');
          }
          where.updatedAt.lte = toDate;
        }
      }

      if (lastSystemAccessFrom || lastSystemAccessTo) {
        where.lastSystemAccess = {};
        if (lastSystemAccessFrom) {
          const fromDate = new Date(lastSystemAccessFrom);
          if (isNaN(fromDate.getTime())) {
            throw new BadRequestException(
              'Invalid lastSystemAccessFrom date format',
            );
          }
          where.lastSystemAccess.gte = fromDate;
        }
        if (lastSystemAccessTo) {
          const toDate = new Date(lastSystemAccessTo);
          if (isNaN(toDate.getTime())) {
            throw new BadRequestException(
              'Invalid lastSystemAccessTo date format',
            );
          }
          where.lastSystemAccess.lte = toDate;
        }
      }

      // Skills (array field)
      if (hasSkills && hasSkills.length > 0) {
        const validSkills = hasSkills.filter((skill) => skill && skill.trim());
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
      if (
        sortBy === 'email' ||
        sortBy === 'username' ||
        sortBy === 'role' ||
        sortBy === 'isEmailVerified' ||
        sortBy === 'firstname' ||
        sortBy === 'lastname'
      ) {
        orderBy.user = { [sortBy]: sortOrder };
      } else {
        // For profile fields, use direct field name
        // Validate that the sort field exists in the profile schema
        const validProfileSortFields = [
          'createdAt',
          'updatedAt',
          'displayName',
          'companyName',
          'systemRole',
          'experience',
          'lastSystemAccess',
          'hourlyRate',
          'industry',
        ];

        if (validProfileSortFields.includes(sortBy)) {
          orderBy[sortBy] = sortOrder;
        } else {
          // Default to createdAt if invalid sort field
          orderBy.createdAt = sortOrder;
        }
      }

      // Execute optimized query with selective field fetching and performance monitoring
      const queryStartTime = Date.now();
      const [profiles, totalCount] = await Promise.all([
        this.prisma.profile.findMany({
          select: {
            userId: true,
            displayName: true,
            companyName: true,
            systemRole: true,
            permissions: true,
            createdAt: true,
            updatedAt: true,
            lastSystemAccess: true,
            skills: true,
            experience: true,
            availability: true,
            workPreferences: true,
            profilePictureUrl: true,
            bio: true,
            adminPreferences: true,
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
          where,
          orderBy,
          skip,
          take: validLimit,
        }),
        this.prisma.profile.count({ where }),
      ]);

      // Transform data to match AdminProfileDto with completion
      const transformedProfiles = profiles.map((profile) => {
        const completion = this.completionService.calculateCompletion(profile);

        return {
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
          profileCompletion: completion.overall, // Add completion percentage
        };
      });

      // Performance monitoring and audit logging
      const queryDuration = Date.now() - queryStartTime;
      await this.auditService.logProfileView(adminUserId || 'unknown', {
        operation: 'admin_get_all_profiles',
        filters: Object.keys(filters),
        resultCount: transformedProfiles.length,
        pagination: { page: validPage, limit: validLimit, totalCount },
        queryPerformance: { duration: queryDuration, optimized: true },
      });

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
    } catch (error) {
      throw new BadRequestException(`Failed to get profiles: ${error.message}`);
    }
  }

  async getProfileByUserId(
    userId: string,
    adminUserId?: string,
  ): Promise<AdminProfileDto> {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }

      if (!userId || typeof userId !== 'string') {
        throw new BadRequestException('Invalid user ID provided');
      }

      const profile = await this.prisma.profile.findUnique({
        select: {
          id: true,
          userId: true,
          displayName: true,
          bio: true,
          profilePictureUrl: true,
          chatLastReadAt: true,
          skills: true,
          experience: true,
          availability: true,
          companyName: true,
          companyWebsite: true,
          companyDescription: true,
          companySize: true,
          contactEmail: true,
          contactPerson: true,
          contactPhone: true,
          currency: true,
          education: true,
          hourlyRate: true,
          industry: true,
          lastSystemAccess: true,
          location: true,
          permissions: true,
          projectPreferences: true,
          socialLinks: true,
          systemRole: true,
          workPreferences: true,
          portfolioLinks: true,
          billingAddress: true,
          createdAt: true,
          updatedAt: true,
          adminPreferences: true,
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
        where: { userId },
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
        // Profile completion
        profileCompletion:
          this.completionService.calculateCompletion(profile).overall,
      };

      // Audit logging
      await this.auditService.logProfileView(adminUserId || 'unknown', {
        operation: 'admin_get_profile_by_user_id',
        targetUserId: userId,
        profileRole: profile?.user?.role,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to get profile: ${error.message}`);
    }
  }

  async getProfileStatistics(
    adminUserId?: string,
  ): Promise<ProfileStatisticsDto> {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }
      // Basic counts only - no expensive real-time calculations
      const [totalProfiles, activeProfiles, verifiedProfiles] =
        await Promise.all([
          this.prisma.profile.count(),
          this.prisma.profile.count({
            where: { user: { isDeleted: false } },
          }),
          this.prisma.profile.count({
            where: { user: { isEmailVerified: true } },
          }),
        ]);

      // Simple role statistics
      const roleStats = await this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: { isDeleted: false },
      });

      const roleStatistics = roleStats.map((stat) => ({
        role: stat.role,
        totalCount: stat._count.id,
        activeCount: stat._count.id,
        verifiedCount: 0, // Simplified - would need separate tracking
        percentage: (stat._count.id / totalProfiles) * 100,
      }));

      // Audit logging
      await this.auditService.logProfileView(adminUserId || 'unknown', {
        operation: 'admin_get_profile_statistics',
        resultCount: totalProfiles,
      });

      return {
        totalProfiles,
        activeProfiles,
        verifiedProfiles,
        roleStatistics,
        registrationTrend: [], // Removed - too expensive
        activityTrend: [], // Removed - too expensive
        topSkills: [], // Removed - too expensive
        geographicDistribution: [], // Removed - too expensive
        activityStatistics: {
          last24Hours: 0,
          last7Days: 0,
          last30Days: 0,
          last90Days: 0,
        },
        averageCompletionRate: 0, // Will be calculated per profile when needed
        profilesThisMonth: 0, // Removed - too expensive
        profilesUpdatedThisMonth: 0, // Removed - too expensive
        growthRate: 0, // Removed - too expensive
        dateRange: 'N/A',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get profile statistics: ${error.message}`,
      );
    }
  }

  async getProfileAnalytics(adminUserId?: string) {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }
      // Basic analytics only - no expensive real-time calculations
      const totalUsers = await this.prisma.user.count({
        where: { isDeleted: false },
      });

      // Audit logging
      await this.auditService.logProfileView(adminUserId || 'unknown', {
        operation: 'admin_get_profile_analytics',
        resultCount: totalUsers,
      });

      return {
        overview: {
          totalUsers,
          newUsersThisMonth: 0, // Removed - too expensive
          activeUsersThisMonth: 0, // Removed - too expensive
          userEngagement: 0, // Removed - too expensive
          engagementRate: 0, // Removed - too expensive
          growthRate: 0, // Removed - too expensive
        },
        skillDistribution: [], // Removed - too expensive
        availabilityStats: {
          available: 0,
          unavailable: 0,
          notSet: 0,
        },
        workPreferenceStats: {
          remoteWork: 0,
          onSiteWork: 0,
          hybridWork: 0,
          notSet: 0,
        },
        roleDistribution: [], // Removed - too expensive
        trends: {
          period: 'N/A',
          startDate: 'N/A',
          endDate: 'N/A',
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get profile analytics: ${error.message}`,
      );
    }
  }

  async getProfileCompletion(userId: string, adminUserId?: string) {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }

      if (!userId || typeof userId !== 'string') {
        throw new BadRequestException('Invalid user ID provided');
      }

      // Get profile with optimized selective user data
      const profile = await this.prisma.profile.findUnique({
        select: {
          userId: true,
          displayName: true,
          bio: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          availability: true,
          location: true,
          contactEmail: true,
          contactPhone: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              isEmailVerified: true,
              isDeleted: true,
            },
          },
        },
        where: { userId },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      // Calculate completion
      const completion = this.completionService.calculateCompletion(profile);

      // Audit logging
      await this.auditService.logProfileView(adminUserId || 'unknown', {
        operation: 'admin_get_profile_completion',
        targetUserId: userId,
        profileRole: profile?.user?.role,
      });

      return {
        completion,
        userId: profile.userId,
        lastUpdated: profile.updatedAt.toISOString(),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get profile completion: ${error.message}`,
      );
    }
  }

  async getCompletionStats(adminUserId?: string) {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }

      // Get optimized profiles for statistics - only fields needed for completion calculation
      const profiles = await this.prisma.profile.findMany({
        select: {
          displayName: true,
          bio: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          availability: true,
          location: true,
          contactEmail: true,
          contactPhone: true,
          user: {
            select: {
              id: true,
              role: true,
              isDeleted: true,
            },
          },
        },
        where: {
          user: {
            isDeleted: false,
          },
        },
      });

      // Calculate completion statistics
      const stats = this.completionService.getCompletionStats(profiles);

      // Audit logging
      await this.auditService.logProfileView(adminUserId || 'unknown', {
        operation: 'admin_get_completion_stats',
        resultCount: profiles.length,
      });

      return {
        ...stats,
        totalProfiles: profiles.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get completion statistics: ${error.message}`,
      );
    }
  }

  async updateProfileByAdmin(
    userId: string,
    dto: AdminUpdateDto,
    adminUserId?: string,
  ): Promise<AdminUpdateResponseDto> {
    try {
      // Security validation - ensure admin access
      if (!adminUserId) {
        throw new BadRequestException('Admin authentication required');
      }

      // Validate user ID
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestException('Invalid user ID provided');
      }

      // Validate DTO
      if (!dto || typeof dto !== 'object') {
        throw new BadRequestException('Invalid profile data provided');
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isDeleted: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isDeleted) {
        throw new BadRequestException('Cannot update profile of deleted user');
      }

      // Check if profile exists
      const existingProfile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new NotFoundException('Profile not found');
      }

      // Separate user and profile updates
      const userUpdates: any = {};
      const profileUpdates: any = {};

      // Map DTO fields to appropriate tables
      if (dto.isEmailVerified !== undefined)
        userUpdates.isEmailVerified = dto.isEmailVerified;
      if (dto.isDeleted !== undefined) userUpdates.isDeleted = dto.isDeleted;
      if (dto.status !== undefined) {
        // Map status to appropriate user field
        if (dto.status === 'banned') {
          userUpdates.isDeleted = true;
        } else if (dto.status === 'suspended') {
          // You might need to add a suspended field to user table
          userUpdates.isSuspended = true;
        } else {
          userUpdates.isDeleted = false;
          userUpdates.isSuspended = false;
        }
      }

      // Profile table updates (system fields only)
      if (dto.systemRole !== undefined)
        profileUpdates.systemRole = dto.systemRole;
      if (dto.permissions !== undefined)
        profileUpdates.permissions = dto.permissions;
      if (dto.adminPreferences !== undefined)
        profileUpdates.adminPreferences = dto.adminPreferences;
      if (dto.lastSystemAccess !== undefined)
        profileUpdates.lastSystemAccess = new Date(dto.lastSystemAccess);
      if (dto.systemNotes !== undefined)
        profileUpdates.systemNotes = dto.systemNotes;
      if (dto.flaggedForReview !== undefined)
        profileUpdates.flaggedForReview = dto.flaggedForReview;
      if (dto.verificationStatus !== undefined)
        profileUpdates.verificationStatus = dto.verificationStatus;
      if (dto.featureFlags !== undefined)
        profileUpdates.featureFlags = dto.featureFlags;
      if (dto.platformSettings !== undefined)
        profileUpdates.platformSettings = dto.platformSettings;

      // Perform updates in transaction
      const [updatedUser, updatedProfile] = await this.prisma.$transaction(async (prisma) => {
        const userResult = Object.keys(userUpdates).length > 0
          ? await prisma.user.update({
              where: { id: userId },
              data: userUpdates,
            })
          : user;

        const profileResult = Object.keys(profileUpdates).length > 0
          ? await prisma.profile.update({
              where: { userId },
              data: profileUpdates,
            })
          : existingProfile;

        return [userResult, profileResult];
      });

      // Get updated fields for audit
      const updatedFields = [
        ...Object.keys(userUpdates),
        ...Object.keys(profileUpdates),
      ];

      // Audit logging
      await this.auditService.logProfileUpdate(
        userId,
        {
          ...userUpdates,
          ...profileUpdates,
        },
        {
          operation: 'admin_update_profile',
          adminUserId: adminUserId,
          fieldsUpdated: updatedFields,
        },
      );

      return {
        message: 'Profile updated successfully by admin',
        profile: {
          userId: updatedProfile.userId,
          systemRole: updatedProfile.systemRole || undefined,
          status: dto.status || 'active',
          updatedAt: updatedProfile.updatedAt.toISOString(),
        },
        updatedFields,
        updatedBy: adminUserId,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update profile: ${error.message}`,
      );
    }
  }
}
