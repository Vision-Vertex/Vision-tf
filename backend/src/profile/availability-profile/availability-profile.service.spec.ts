import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityProfileService } from './availability-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AvailabilityDto,
  WorkPreferencesDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';

describe('AvailabilityProfileService', () => {
  let service: AvailabilityProfileService;
  let prisma: PrismaService;

  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityProfileService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AvailabilityProfileService>(
      AvailabilityProfileService,
    );
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('updateAvailability', () => {
    const validAvailability: AvailabilityDto = {
      available: true,
      hours: '9:00-17:00',
      timezone: 'UTC+3',
      noticePeriod: '2 weeks',
      maxHoursPerWeek: 40,
      preferredProjectTypes: ['web', 'mobile'],
    };

    it('should update availability successfully when profile exists', async () => {
      mockPrisma.profile.update.mockResolvedValue({
        availability: validAvailability,
      });
      const result = await service.updateAvailability(
        'user1',
        validAvailability,
      );
      expect(result).toEqual(validAvailability);
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: { availability: validAvailability },
        select: { availability: true },
      });
    });

    it('should update availability with partial data', async () => {
      const partialAvailability = { available: true, timezone: 'UTC+3' };
      mockPrisma.profile.update.mockResolvedValue({
        availability: partialAvailability,
      });
      const result = await service.updateAvailability(
        'user1',
        partialAvailability,
      );
      expect(result).toEqual(partialAvailability);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrisma.profile.update.mockRejectedValue({ code: 'P2025' });
      await expect(
        service.updateAvailability('user1', validAvailability),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors during profile update', async () => {
      mockPrisma.profile.update.mockRejectedValue(new Error('Database error'));
      await expect(
        service.updateAvailability('user1', validAvailability),
      ).rejects.toThrow(Error);
    });

    it('should handle complex availability data with custom fields', async () => {
      const complexAvailability = {
        ...validAvailability,
        customField: 'custom value',
      };
      mockPrisma.profile.update.mockResolvedValue({
        availability: complexAvailability,
      });
      const result = await service.updateAvailability(
        'user1',
        complexAvailability,
      );
      expect(result).toEqual(complexAvailability);
    });

    it('should validate timezone format', async () => {
      const invalidAvailability = {
        ...validAvailability,
        timezone: 'invalid-timezone',
      };
      await expect(
        service.updateAvailability('user1', invalidAvailability),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate time format', async () => {
      const invalidAvailability = {
        ...validAvailability,
        hours: 'invalid-time',
      };
      await expect(
        service.updateAvailability('user1', invalidAvailability),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate max hours per week', async () => {
      const invalidAvailability = {
        ...validAvailability,
        maxHoursPerWeek: 200,
      };
      await expect(
        service.updateAvailability('user1', invalidAvailability),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize input strings', async () => {
      const availabilityWithSpecialChars = {
        ...validAvailability,
        noticePeriod: '<script>alert("xss")</script>2 weeks',
      };
      mockPrisma.profile.update.mockResolvedValue({
        availability: availabilityWithSpecialChars,
      });
      await service.updateAvailability('user1', availabilityWithSpecialChars);
      expect(prisma.profile.update).toHaveBeenCalled();
    });
  });

  describe('updateWorkPreferences', () => {
    const validWorkPreferences: WorkPreferencesDto = {
      remoteWork: true,
      onSiteWork: false,
      hybridWork: true,
      travelWillingness: 'national',
      contractTypes: ['hourly', 'fixed'],
      minProjectDuration: '1-2 weeks',
      maxProjectDuration: '6+ months',
    };

    it('should update work preferences successfully when profile exists', async () => {
      mockPrisma.profile.update.mockResolvedValue({
        workPreferences: validWorkPreferences,
      });
      const result = await service.updateWorkPreferences(
        'user1',
        validWorkPreferences,
      );
      expect(result).toEqual(validWorkPreferences);
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: { workPreferences: validWorkPreferences },
        select: { workPreferences: true },
      });
    });

    it('should update work preferences with partial data', async () => {
      const partialPreferences = { remoteWork: true, onSiteWork: false };
      mockPrisma.profile.update.mockResolvedValue({
        workPreferences: partialPreferences,
      });
      const result = await service.updateWorkPreferences(
        'user1',
        partialPreferences,
      );
      expect(result).toEqual(partialPreferences);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrisma.profile.update.mockRejectedValue({ code: 'P2025' });
      await expect(
        service.updateWorkPreferences('user1', validWorkPreferences),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors during profile update', async () => {
      mockPrisma.profile.update.mockRejectedValue(new Error('Database error'));
      await expect(
        service.updateWorkPreferences('user1', validWorkPreferences),
      ).rejects.toThrow(Error);
    });

    it('should handle complex work preferences data with custom fields', async () => {
      const complexPreferences = {
        ...validWorkPreferences,
        customField: 'custom value',
      };
      mockPrisma.profile.update.mockResolvedValue({
        workPreferences: complexPreferences,
      });
      const result = await service.updateWorkPreferences(
        'user1',
        complexPreferences,
      );
      expect(result).toEqual(complexPreferences);
    });

    it('should sanitize input strings', async () => {
      const preferencesWithSpecialChars = {
        ...validWorkPreferences,
        travelWillingness: '<script>alert("xss")</script>national',
      };
      mockPrisma.profile.update.mockResolvedValue({
        workPreferences: preferencesWithSpecialChars,
      });
      await service.updateWorkPreferences('user1', preferencesWithSpecialChars);
      expect(prisma.profile.update).toHaveBeenCalled();
    });
  });

  describe('getAvailability', () => {
    it('should return availability when profile exists with availability data', async () => {
      const availability = { available: true, timezone: 'UTC+3' };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.getAvailability('user1');
      expect(result).toEqual(availability);
    });

    it('should return null when profile exists but has no availability data', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ availability: null });
      const result = await service.getAvailability('user1');
      expect(result).toBeNull();
    });

    it('should return null when profile does not exist', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      const result = await service.getAvailability('user1');
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.profile.findUnique.mockRejectedValue(
        new Error('Database error'),
      );
      await expect(service.getAvailability('user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getWorkPreferences', () => {
    it('should return work preferences when profile exists with work preferences data', async () => {
      const workPreferences = { remoteWork: true, onSiteWork: false };
      mockPrisma.profile.findUnique.mockResolvedValue({ workPreferences });
      const result = await service.getWorkPreferences('user1');
      expect(result).toEqual(workPreferences);
    });

    it('should return null when profile exists but has no work preferences data', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        workPreferences: null,
      });
      const result = await service.getWorkPreferences('user1');
      expect(result).toBeNull();
    });

    it('should return null when profile does not exist', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      const result = await service.getWorkPreferences('user1');
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.profile.findUnique.mockRejectedValue(
        new Error('Database error'),
      );
      await expect(service.getWorkPreferences('user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return true when user is available', async () => {
      const availability = { available: true };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(true);
    });

    it('should return false when user is not available', async () => {
      const availability = { available: false };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);
    });

    it('should return false when availability is null', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ availability: null });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);
    });

    it('should return false when profile does not exist', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);
    });

    it('should return false when availability object exists but available field is undefined', async () => {
      const availability = { timezone: 'UTC+3' };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);
    });

    it('should return false when availability object exists but available field is null', async () => {
      const availability = { available: null, timezone: 'UTC+3' };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.profile.findUnique.mockRejectedValue(
        new Error('Database error'),
      );
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);
    });

    it('should check time-based availability when hours are specified', async () => {
      // Mock current time to be within working hours
      const originalDate = global.Date;
      const mockDate = new Date('2023-01-01T10:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const availability = { available: true, hours: '9:00-17:00' };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(true);

      global.Date = originalDate;
    });

    it('should return false when current time is outside working hours', async () => {
      // Mock current time to be outside working hours
      const originalDate = global.Date;
      const mockDate = new Date('2023-01-01T20:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const availability = { available: true, hours: '9:00-17:00' };
      mockPrisma.profile.findUnique.mockResolvedValue({ availability });
      const result = await service.checkAvailability('user1');
      expect(result).toBe(false);

      global.Date = originalDate;
    });
  });
});
