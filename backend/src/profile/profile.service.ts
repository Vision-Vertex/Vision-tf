import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto/update-client-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto/update-admin-profile.dto';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto/update-developer-profile.dto';
import { SuccessResponse } from '../common/dto/api-response.dto';
import { AuditService } from './services/audit.service';
import { ProfileCompletionService } from './services/profile-completion.service';
import { UserRole } from '@prisma/client';
import isURL from 'validator/lib/isURL';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private profileCompletionService: ProfileCompletionService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validations
    if (dto.profilePictureUrl && !isURL(dto.profilePictureUrl)) {
      throw new BadRequestException('Invalid profile picture URL format');
    }

    if (dto.displayName && dto.displayName.trim().length < 2) {
      throw new BadRequestException(
        'Display name must be at least 2 characters',
      );
    }

    if (dto.bio && dto.bio.trim().length > 500) {
      throw new BadRequestException('Bio must be 500 characters or less');
    }

    // Update only provided fields
    const updatedUser = await this.prisma.profile.update({
      where: { userId },
      data: dto,
    });

    return new SuccessResponse('Profile updated successfully', updatedUser);
  }

  async updateDeveloperProfile(userId: string, dto: UpdateDeveloperProfileDto) {
    // Ensure user exists and is a developer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'DEVELOPER') {
      throw new BadRequestException(
        'User is not a Developer or does not exist',
      );
    }

    // Validate portfolioLinks URLs
    if (dto.portfolioLinks) {
      const { github, linkedin, website, x, customLinks } = dto.portfolioLinks;
      const urlFields = [github, linkedin, website, x];
      for (const url of urlFields) {
        if (url && !isURL(url)) {
          throw new BadRequestException(
            `Invalid URL in portfolio links: ${url}`,
          );
        }
      }
      if (customLinks) {
        for (const link of customLinks) {
          if (!isURL(link.url)) {
            throw new BadRequestException(
              `Invalid custom link URL: ${link.url}`,
            );
          }
        }
      }
    }

    // Convert class instances to plain objects & remove undefined fields
    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    // Special handling for JSON fields that are nested objects
    const jsonFields = [
      'availability',
      'portfolioLinks',
      'education',
      'workPreferences',
      // Add any other nested JSON fields if present
    ];

    for (const field of jsonFields) {
      if (cleanDto[field]) {
        cleanDto[field] = JSON.parse(JSON.stringify(cleanDto[field])); // Deep clone to plain object
      }
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: cleanDto,
    });

    return new SuccessResponse(
      'Developer profile updated successfully',
      updatedProfile,
    );
  }
  async updateClientProfile(userId: string, dto: UpdateClientProfileDto) {
    try {
      // Ensure user exists and is client
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user || user.role !== 'CLIENT') {
        throw new BadRequestException('User is not a client or does not exist');
      }

      // Sanitize input data
      const sanitizedDto = this.sanitizeClientData(dto);

      // Convert class instances to plain objects & remove undefined fields
      const cleanDto = Object.fromEntries(
        Object.entries(sanitizedDto).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      // Optimize JSON field handling - avoid double conversion
      const jsonFields = [
        'location',
        'billingAddress',
        'projectPreferences',
        'socialLinks',
      ];
      for (const field of jsonFields) {
        if (cleanDto[field]) {
          // Convert to plain object without double JSON parsing
          cleanDto[field] = this.convertToPlainObject(cleanDto[field]);
        }
      }

      const updatedProfile = await this.prisma.profile.update({
        where: { userId },
        data: cleanDto,
      });

      // Audit logging
      await this.auditService.logProfileUpdate(userId, cleanDto, {
        operation: 'client_profile_update',
        fieldsUpdated: Object.keys(cleanDto),
      });

      return new SuccessResponse(
        'Client profile updated successfully',
        updatedProfile,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'client profile update');
    }
  }

  async updateAdminProfile(userId: string, dto: UpdateAdminProfileDto) {
    // Verify user exists and is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('User is not an admin or does not exist');
    }

    // Clean dto to remove undefined fields
    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    // Handle nested adminPreferences and notificationSettings if present
    if (cleanDto.adminPreferences) {
      cleanDto.adminPreferences = Object.fromEntries(
        Object.entries(cleanDto.adminPreferences).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      // Clean notificationSettings if present
      if (cleanDto.adminPreferences.notificationSettings) {
        cleanDto.adminPreferences.notificationSettings = Object.fromEntries(
          Object.entries(cleanDto.adminPreferences.notificationSettings).filter(
            ([_, value]) => value !== undefined,
          ),
        );
      }
    }

    // Update admin profile via Prisma
    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: cleanDto,
    });

    return new SuccessResponse(
      'Admin profile updated successfully',
      updatedProfile,
    );
  }

  async getMyProfile(userId: string) {
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    if (!userWithProfile) {
      throw new NotFoundException('User not found');
    }

    const { role, profile } = userWithProfile;
    const common = this.getCommonFields(profile);
    let roleSpecific = {};

    if (role === 'DEVELOPER') {
      roleSpecific = this.getDeveloperFields(profile);
    } else if (role === 'CLIENT') {
      roleSpecific = this.getClientFields(profile);
    } else if (role === 'ADMIN') {
      roleSpecific = this.getAdminFields(profile);
    }

    return {
      userId: userWithProfile.id,
      email: userWithProfile.email,
      role,
      profile: {
        ...common,
        ...roleSpecific,
      },
    };
  }

  /**
   * Get profile completion for a user
   * Reuses the existing completion service logic
   */
  async getProfileCompletion(userId: string) {
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        profile: true,
      },
    });

    if (!userWithProfile) {
      throw new NotFoundException('User not found');
    }

    const completion = this.profileCompletionService.calculateCompletion(
      userWithProfile.profile,
    );

    return {
      completion,
      userId: userWithProfile.id,
      lastUpdated:
        userWithProfile.profile?.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Validate profile for a user
   * Reuses the existing validation service logic
   */
  async validateProfile(userId: string) {
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        profile: true,
      },
    });

    if (!userWithProfile) {
      throw new NotFoundException('User not found');
    }

    const validation = this.profileCompletionService.validateProfile(
      userWithProfile.profile,
      userWithProfile.role,
    );

    return {
      ...validation,
      userId: userWithProfile.id,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get required fields for a user's role
   * Reuses the existing required fields service logic
   */
  async getRequiredFields(userId: string) {
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        profile: true,
      },
    });

    if (!userWithProfile) {
      throw new NotFoundException('User not found');
    }

    return this.profileCompletionService.getRequiredFields(
      userWithProfile.role,
      userWithProfile.profile,
    );
  }

  // Helper methods (private)
  private getCommonFields(profile: any) {
    const { displayName, bio, profilePictureUrl, chatLastReadAt } =
      profile || {};
    return { displayName, bio, profilePictureUrl, chatLastReadAt };
  }

  private getDeveloperFields(profile: any) {
    const {
      skills,
      experience,
      hourlyRate,
      currency,
      availability,
      portfolioLinks,
      education,
      workPreferences,
    } = profile || {};
    return {
      skills,
      experience,
      hourlyRate,
      currency,
      availability,
      portfolioLinks,
      education,
      workPreferences,
    };
  }

  private getClientFields(profile: any) {
    const {
      companyName,
      companyWebsite,
      companySize,
      industry,
      companyDescription,
      contactPerson,
      contactEmail,
      contactPhone,
      location,
      billingAddress,
      projectPreferences,
      socialLinks,
    } = profile || {};
    return {
      companyName,
      companyWebsite,
      companySize,
      industry,
      companyDescription,
      contactPerson,
      contactEmail,
      contactPhone,
      location,
      billingAddress,
      projectPreferences,
      socialLinks,
    };
  }

  private getAdminFields(profile: any) {
    const { systemRole, permissions, lastSystemAccess, adminPreferences } =
      profile || {};
    return { systemRole, permissions, lastSystemAccess, adminPreferences };
  }

  // Helper methods for client profile
  private sanitizeClientData(
    dto: UpdateClientProfileDto,
  ): UpdateClientProfileDto {
    const sanitized = { ...dto };

    // Sanitize string fields
    const stringFields = [
      'companyName',
      'companySize',
      'industry',
      'companyDescription',
      'contactPerson',
      'contactEmail',
      'contactPhone',
    ];

    for (const field of stringFields) {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeString(sanitized[field]);
      }
    }

    // Sanitize nested objects
    if (sanitized.location) {
      sanitized.location = this.sanitizeLocation(sanitized.location);
    }

    if (sanitized.billingAddress) {
      sanitized.billingAddress = this.sanitizeBillingAddress(
        sanitized.billingAddress,
      );
    }

    if (sanitized.projectPreferences) {
      sanitized.projectPreferences = this.sanitizeProjectPreferences(
        sanitized.projectPreferences,
      );
    }

    if (sanitized.socialLinks) {
      sanitized.socialLinks = this.sanitizeSocialLinks(sanitized.socialLinks);
    }

    return sanitized;
  }

  private sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags
  }

  private sanitizeLocation(location: any): any {
    return {
      country: location.country
        ? this.sanitizeString(location.country)
        : undefined,
      city: location.city ? this.sanitizeString(location.city) : undefined,
      state: location.state ? this.sanitizeString(location.state) : undefined,
      timezone: location.timezone
        ? this.sanitizeString(location.timezone)
        : undefined,
    };
  }

  private sanitizeBillingAddress(billingAddress: any): any {
    return {
      street: billingAddress.street
        ? this.sanitizeString(billingAddress.street)
        : undefined,
      city: billingAddress.city
        ? this.sanitizeString(billingAddress.city)
        : undefined,
      state: billingAddress.state
        ? this.sanitizeString(billingAddress.state)
        : undefined,
      country: billingAddress.country
        ? this.sanitizeString(billingAddress.country)
        : undefined,
      postalCode: billingAddress.postalCode
        ? this.sanitizeString(billingAddress.postalCode)
        : undefined,
    };
  }

  private sanitizeProjectPreferences(preferences: any): any {
    return {
      typicalProjectBudget: preferences.typicalProjectBudget
        ? this.sanitizeString(preferences.typicalProjectBudget)
        : undefined,
      typicalProjectDuration: preferences.typicalProjectDuration
        ? this.sanitizeString(preferences.typicalProjectDuration)
        : undefined,
      preferredCommunication: preferences.preferredCommunication
        ? preferences.preferredCommunication.map(this.sanitizeString)
        : undefined,
      timezonePreference: preferences.timezonePreference
        ? this.sanitizeString(preferences.timezonePreference)
        : undefined,
      projectTypes: preferences.projectTypes
        ? preferences.projectTypes.map(this.sanitizeString)
        : undefined,
    };
  }

  private sanitizeSocialLinks(socialLinks: any): any {
    return {
      linkedin: socialLinks.linkedin,
      website: socialLinks.website,
      x: socialLinks.x,
      customLinks: socialLinks.customLinks
        ? socialLinks.customLinks.map((link: any) => ({
            label: this.sanitizeString(link.label),
            url: link.url, // URL validation is handled by @IsUrl decorator
            description: link.description
              ? this.sanitizeString(link.description)
              : undefined,
          }))
        : undefined,
    };
  }

  private convertToPlainObject(obj: any): any {
    // More efficient than JSON.parse(JSON.stringify())
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj))
      return obj.map((item) => this.convertToPlainObject(item));

    const plainObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      plainObj[key] = this.convertToPlainObject(value);
    }
    return plainObj;
  }

  private handlePrismaError(error: any, operation: string): never {
    if (error.code === 'P2025') {
      throw new NotFoundException(`Profile not found for ${operation}`);
    }
    if (error.code === 'P2002') {
      throw new BadRequestException(`Duplicate entry for ${operation}`);
    }
    if (error.code === 'P2003') {
      throw new BadRequestException(
        `Foreign key constraint failed for ${operation}`,
      );
    }
    if (error.code === 'P2014') {
      throw new BadRequestException(
        `The change you are trying to make would violate the required relation for ${operation}`,
      );
    }
    if (error.code === 'P2021') {
      throw new InternalServerErrorException(
        `The table does not exist for ${operation}`,
      );
    }
    if (error.code === 'P2022') {
      throw new InternalServerErrorException(
        `The column does not exist for ${operation}`,
      );
    }

    console.error(`Prisma error in ${operation}:`, error);
    throw new InternalServerErrorException(
      `Database operation failed: ${operation}`,
    );
  }
}
