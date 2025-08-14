import { BadRequestException, Injectable , NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto/update-client-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto/update-admin-profile.dto';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto/update-developer-profile.dto';
import { SuccessResponse } from '../common/dto/api-response.dto';
import isURL from 'validator/lib/isURL';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

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
    throw new BadRequestException('Display name must be at least 2 characters');
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
      throw new BadRequestException('User is not a Developer or does not exist');
    }

    // Validate portfolioLinks URLs
    if (dto.portfolioLinks) {
      const { github, linkedin, website, x, customLinks } = dto.portfolioLinks;
      const urlFields = [github, linkedin, website, x];
      for (const url of urlFields) {
        if (url && !isURL(url)) {
          throw new BadRequestException(`Invalid URL in portfolio links: ${url}`);
        }
      }
      if (customLinks) {
        for (const link of customLinks) {
          if (!isURL(link.url)) {
            throw new BadRequestException(`Invalid custom link URL: ${link.url}`);
          }
        }
      }
    }

    // Convert class instances to plain objects & remove undefined fields
    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined)
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

    return new SuccessResponse('Developer profile updated successfully', updatedProfile);
  }
 async updateClientProfile(userId: string, dto: UpdateClientProfileDto) {
  // Ensure user exists and is client
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'CLIENT') {
    throw new BadRequestException('User is not a client or does not exist');
  }
 if (dto.companyWebsite) {
    try {
      new URL(dto.companyWebsite);
    } catch {
      throw new BadRequestException('Invalid company website URL');
    }
  }

  // Additional billing address validation
  if (dto.billingAddress) {
    const { country, postalCode } = dto.billingAddress;

    // Validate country format (ISO 2-3 uppercase letters)
    if (country && !/^[A-Z]{2,3}$/.test(country)) {
      throw new BadRequestException('Country must be 2-3 uppercase letters (ISO code)');
    }

    // Validate postal code allowed characters and length
    if (postalCode && !/^[0-9A-Za-z\- ]{3,10}$/.test(postalCode)) {
      throw new BadRequestException('Postal code must be 3-10 characters and alphanumeric with dashes/spaces allowed');
    }
  }


  // Convert class instances to plain objects & remove undefined fields
  const cleanDto = Object.fromEntries(
    Object.entries(dto).filter(([_, value]) => value !== undefined)
  );

  // Special handling for JSON fields
  const jsonFields = ['location', 'billingAddress', 'projectPreferences', 'socialLinks'];
  for (const field of jsonFields) {
    if (cleanDto[field]) {
      cleanDto[field] = JSON.parse(JSON.stringify(cleanDto[field])); // converts to plain object
    }
  }

  const updatedProfile = await this.prisma.profile.update({
    where: { userId },
    data: cleanDto,
  });

  return new SuccessResponse('Client profile updated successfully', updatedProfile);
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
      Object.entries(dto).filter(([_, value]) => value !== undefined)
    );

    // Handle nested adminPreferences and notificationSettings if present
    if (cleanDto.adminPreferences) {
      
      cleanDto.adminPreferences = Object.fromEntries(
        Object.entries(cleanDto.adminPreferences).filter(([_, value]) => value !== undefined)
      );

      // Clean notificationSettings if present
      if (cleanDto.adminPreferences.notificationSettings) {
        cleanDto.adminPreferences.notificationSettings = Object.fromEntries(
          Object.entries(cleanDto.adminPreferences.notificationSettings).filter(([_, value]) => value !== undefined)
        );
      }
    }

    // Update admin profile via Prisma
    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: cleanDto,
    });

    return new SuccessResponse('Admin profile updated successfully', updatedProfile);
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

  // Helper methods (private)
  private getCommonFields(profile: any) {
    const {displayName,bio,profilePictureUrl,chatLastReadAt,
    } = profile || {};
    return { displayName, bio, profilePictureUrl, chatLastReadAt };
  }

  private getDeveloperFields(profile: any) {
    const {skills,experience,hourlyRate,currency,availability,portfolioLinks,education,workPreferences,
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
    const {companyName,companyWebsite,companySize,industry,companyDescription,contactPerson,contactEmail,contactPhone,location,billingAddress,projectPreferences,socialLinks,
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
    const {systemRole,permissions,lastSystemAccess,adminPreferences,} = profile || {};
    return {systemRole, permissions,lastSystemAccess,adminPreferences,
    };
  }
}
