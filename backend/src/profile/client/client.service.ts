import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompanyInfoDto } from '../dto/update-client-profile.dto/company-info.dto';
import { IsString, IsOptional, IsUrl, IsEmail, IsPhoneNumber } from 'class-validator';
import { BillingAddressDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { instanceToPlain } from 'class-transformer';
import { ProjectPreferencesDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { SocialLinksDto } from '../dto/update-client-profile.dto/update-client-profile.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async updateCompanyInfo(userId: string, dto: CompanyInfoDto) {
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, profile: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can update company information');
    }

    if (!user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const {
      companyName,
      companyWebsite,
      companySize,
      industry,
      companyDescription,
      contactPerson,
      contactEmail,
      contactPhone,
    } = dto;

    const updatedProfile = await this.prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        companyName,
        companyWebsite,
        companySize,
        industry,
        companyDescription,
        contactPerson,
        contactEmail,
        contactPhone,
      },
    });

    return updatedProfile;
  }
  async updateBillingAddress(userId: string, dto: BillingAddressDto) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, profile: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can update billing address');
    }

    if (!user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const billingAddressPlain = instanceToPlain(dto);

  const updatedProfile = await this.prisma.profile.update({
    where: { id: user.profile.id },
    data: {
      billingAddress: billingAddressPlain,
    },
  });

  return updatedProfile;
}
 async updateProjectPreferences(userId: string, dto: ProjectPreferencesDto) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, profile: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can update project preferences');
    }

    if (!user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }


    const projectPreferencesPlain = instanceToPlain(dto);

    const updatedProfile = await this.prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        projectPreferences: projectPreferencesPlain,
      },
    });

    return updatedProfile;
  }
  async updateClientSocialLinks(userId: string, dto: SocialLinksDto) {
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, profile: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can update social links');
    }

    if (!user.profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    
    const socialLinksPlain = instanceToPlain(dto);

    
    const updatedProfile = await this.prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        socialLinks: socialLinksPlain,
      },
    });

    return updatedProfile;
  }
}

