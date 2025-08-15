import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { WorkPreferencesDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
@Injectable()
export class AvailabilityProfileService {
  constructor(private prisma: PrismaService) {}

  // Update availability settings
  async updateAvailability(userId: string, dto: AvailabilityDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Profile not found');

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { availability: dto as any },
    });

    return updated.availability;
  }

  // Update work preferences
  async updateWorkPreferences(userId: string, dto: WorkPreferencesDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Profile not found');

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { workPreferences: dto as any },
    });

    return updated.workPreferences;
  }

  // Get availability
  async getAvailability(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { availability: true },
    });
    return profile?.availability || null;
  }

  // Get work preferences
  async getWorkPreferences(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { workPreferences: true },
    });
    return profile?.workPreferences || null;
  }

  // Check if user is currently available (simple logic)
  async checkAvailability(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { availability: true },
    });

    if (!profile?.availability) return false;
    
    const availability = profile.availability as AvailabilityDto;
    return availability.available === true;
  }
}
