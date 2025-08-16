import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { WorkPreferencesDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';

@Injectable()
export class AvailabilityProfileService {
  // Cache timezone validation regex
  private readonly timezonePattern = /^(UTC|GMT)[+-]\d{1,2}(:\d{2})?$/i;
  private readonly timePattern = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/;

  constructor(private prisma: PrismaService) {}

  private sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException({
        message: 'Input must be a valid string',
        error: 'INVALID_INPUT',
      });
    }

    const sanitized = input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 100); // Limit length

    if (sanitized.length === 0) {
      throw new BadRequestException({
        message: 'Input cannot be empty after sanitization',
        error: 'EMPTY_INPUT',
      });
    }

    return sanitized;
  }

  private validateTimezone(timezone: string): void {
    if (!this.timezonePattern.test(timezone)) {
      throw new BadRequestException({
        message:
          'Invalid timezone format. Use format like UTC+3, GMT-5, UTC+03:30',
        error: 'INVALID_TIMEZONE',
        details: { timezone },
      });
    }
  }

  private validateTimeFormat(time: string): void {
    if (!this.timePattern.test(time)) {
      throw new BadRequestException({
        message: 'Invalid time format. Use format like 9:00-17:00',
        error: 'INVALID_TIME_FORMAT',
        details: { time },
      });
    }
  }

  private validateAvailabilityDto(dto: AvailabilityDto): void {
    if (dto.timezone) {
      this.validateTimezone(this.sanitizeInput(dto.timezone));
    }

    if (dto.hours) {
      this.validateTimeFormat(this.sanitizeInput(dto.hours));
    }

    if (dto.maxHoursPerWeek !== undefined) {
      if (dto.maxHoursPerWeek < 1 || dto.maxHoursPerWeek > 168) {
        throw new BadRequestException({
          message: 'Max hours per week must be between 1 and 168',
          error: 'INVALID_HOURS',
          details: { maxHoursPerWeek: dto.maxHoursPerWeek },
        });
      }
    }

    if (dto.preferredProjectTypes) {
      dto.preferredProjectTypes = dto.preferredProjectTypes.map((type) =>
        this.sanitizeInput(type),
      );
    }
  }

  private validateWorkPreferencesDto(dto: WorkPreferencesDto): void {
    if (dto.contractTypes) {
      dto.contractTypes = dto.contractTypes.map((type) =>
        this.sanitizeInput(type),
      );
    }

    if (dto.travelWillingness) {
      dto.travelWillingness = this.sanitizeInput(dto.travelWillingness);
    }

    if (dto.minProjectDuration) {
      dto.minProjectDuration = this.sanitizeInput(dto.minProjectDuration);
    }

    if (dto.maxProjectDuration) {
      dto.maxProjectDuration = this.sanitizeInput(dto.maxProjectDuration);
    }
  }

  // Update availability settings with single database operation
  async updateAvailability(userId: string, dto: AvailabilityDto) {
    this.validateAvailabilityDto(dto);

    try {
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { availability: dto },
        select: { availability: true },
      });

      return result.availability;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
          details: { userId },
        });
      }
      throw error;
    }
  }

  // Update work preferences with single database operation
  async updateWorkPreferences(userId: string, dto: WorkPreferencesDto) {
    this.validateWorkPreferencesDto(dto);

    try {
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { workPreferences: dto },
        select: { workPreferences: true },
      });

      return result.workPreferences;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
          details: { userId },
        });
      }
      throw error;
    }
  }

  // Get availability
  async getAvailability(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { availability: true },
      });
      return profile?.availability || null;
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to retrieve availability',
        error: 'DATABASE_ERROR',
        details: { userId },
      });
    }
  }

  // Get work preferences
  async getWorkPreferences(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { workPreferences: true },
      });
      return profile?.workPreferences || null;
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to retrieve work preferences',
        error: 'DATABASE_ERROR',
        details: { userId },
      });
    }
  }

  // Enhanced availability checking with time-based logic
  async checkAvailability(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { availability: true },
      });

      if (!profile?.availability) return false;

      const availability = profile.availability as AvailabilityDto;

      // Basic availability check
      if (availability.available !== true) return false;

      // Time-based availability check (if hours are specified)
      if (availability.hours) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute; // Convert to minutes for easier comparison

        // Parse time range (e.g., "9:00-17:00")
        const timeMatch = availability.hours.match(this.timePattern);
        if (timeMatch) {
          const startHour = parseInt(timeMatch[1]);
          const startMinute = parseInt(timeMatch[2]);
          const endHour = parseInt(timeMatch[3]);
          const endMinute = parseInt(timeMatch[4]);

          const startTime = startHour * 60 + startMinute;
          const endTime = endHour * 60 + endMinute;

          if (currentTime < startTime || currentTime > endTime) {
            return false;
          }
        }
        // If time format doesn't match, assume available (don't fail the check)
      }

      return true;
    } catch (error) {
      // If there's an error during availability check, return false instead of throwing
      // This prevents the availability check from breaking the system
      console.error('Error checking availability:', error);
      return false;
    }
  }
}
