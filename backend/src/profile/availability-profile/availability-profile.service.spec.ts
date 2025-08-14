import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AvailabilityProfileService } from './availability-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { WorkPreferencesDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';

describe('AvailabilityProfileService', () => {
  let service: AvailabilityProfileService;
  let prismaService: any;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AvailabilityProfileService>(AvailabilityProfileService);
    prismaService = module.get(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('updateAvailability', () => {
    const userId = 'test-user-id';
    const availabilityDto: AvailabilityDto = {
      available: true,
      hours: '9-5',
      timezone: 'UTC+3',
      noticePeriod: '2 weeks',
      maxHoursPerWeek: 40,
      preferredProjectTypes: ['web', 'mobile'],
    };

    it('should update availability successfully when profile exists', async () => {
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: availabilityDto };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, availabilityDto);

      expect(result).toEqual(availabilityDto);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { availability: availabilityDto },
      });
    });

    it('should update availability with partial data', async () => {
      const partialDto = { available: false, timezone: 'UTC+5' };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: partialDto };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, partialDto);

      expect(result).toEqual(partialDto);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { availability: partialDto },
      });
    });

    it('should throw BadRequestException when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.updateAvailability(userId, availabilityDto)).rejects.toThrow(
        new BadRequestException('Profile not found')
      );

      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile lookup', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.updateAvailability(userId, availabilityDto)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile update', async () => {
      const mockProfile = { id: 'profile-id', userId };
      const error = new Error('Update failed');
      
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.updateAvailability(userId, availabilityDto)).rejects.toThrow('Update failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { availability: availabilityDto },
      });
    });

    it('should handle complex availability data with custom fields', async () => {
      const complexDto = {
        ...availabilityDto,
        customField: 'custom value',
        nestedObject: { key: 'value' },
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: complexDto };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, complexDto);

      expect(result).toEqual(complexDto);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { availability: complexDto },
      });
    });
  });

  describe('updateWorkPreferences', () => {
    const userId = 'test-user-id';
    const workPreferencesDto: WorkPreferencesDto = {
      remoteWork: true,
      onSiteWork: false,
      hybridWork: true,
      travelWillingness: 'national',
      contractTypes: ['hourly', 'fixed'],
      minProjectDuration: '1-2 weeks',
      maxProjectDuration: '6+ months',
    };

    it('should update work preferences successfully when profile exists', async () => {
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, workPreferences: workPreferencesDto };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateWorkPreferences(userId, workPreferencesDto);

      expect(result).toEqual(workPreferencesDto);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { workPreferences: workPreferencesDto },
      });
    });

    it('should update work preferences with partial data', async () => {
      const partialDto = { remoteWork: true, contractTypes: ['hourly'] };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, workPreferences: partialDto };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateWorkPreferences(userId, partialDto);

      expect(result).toEqual(partialDto);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { workPreferences: partialDto },
      });
    });

    it('should throw BadRequestException when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.updateWorkPreferences(userId, workPreferencesDto)).rejects.toThrow(
        new BadRequestException('Profile not found')
      );

      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile lookup', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.updateWorkPreferences(userId, workPreferencesDto)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile update', async () => {
      const mockProfile = { id: 'profile-id', userId };
      const error = new Error('Update failed');
      
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.updateWorkPreferences(userId, workPreferencesDto)).rejects.toThrow('Update failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { workPreferences: workPreferencesDto },
      });
    });

    it('should handle complex work preferences data with custom fields', async () => {
      const complexDto = {
        ...workPreferencesDto,
        customField: 'custom value',
        nestedObject: { key: 'value' },
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, workPreferences: complexDto };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateWorkPreferences(userId, complexDto);

      expect(result).toEqual(complexDto);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { workPreferences: complexDto },
      });
    });
  });

  describe('getAvailability', () => {
    const userId = 'test-user-id';

    it('should return availability when profile exists with availability data', async () => {
      const mockAvailability = {
        available: true,
        hours: '9-5',
        timezone: 'UTC+3',
      };
      const mockProfile = { availability: mockAvailability };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getAvailability(userId);

      expect(result).toEqual(mockAvailability);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return null when profile exists but has no availability data', async () => {
      const mockProfile = { availability: null };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getAvailability(userId);

      expect(result).toBeNull();
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return null when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      const result = await service.getAvailability(userId);

      expect(result).toBeNull();
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.getAvailability(userId)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });
  });

  describe('getWorkPreferences', () => {
    const userId = 'test-user-id';

    it('should return work preferences when profile exists with work preferences data', async () => {
      const mockWorkPreferences = {
        remoteWork: true,
        onSiteWork: false,
        hybridWork: true,
        contractTypes: ['hourly'],
      };
      const mockProfile = { workPreferences: mockWorkPreferences };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getWorkPreferences(userId);

      expect(result).toEqual(mockWorkPreferences);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { workPreferences: true },
      });
    });

    it('should return null when profile exists but has no work preferences data', async () => {
      const mockProfile = { workPreferences: null };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getWorkPreferences(userId);

      expect(result).toBeNull();
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { workPreferences: true },
      });
    });

    it('should return null when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      const result = await service.getWorkPreferences(userId);

      expect(result).toBeNull();
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { workPreferences: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.getWorkPreferences(userId)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { workPreferences: true },
      });
    });
  });

  describe('checkAvailability', () => {
    const userId = 'test-user-id';

    it('should return true when user is available', async () => {
      const mockAvailability = { available: true };
      const mockProfile = { availability: mockAvailability };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.checkAvailability(userId);

      expect(result).toBe(true);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return false when user is not available', async () => {
      const mockAvailability = { available: false };
      const mockProfile = { availability: mockAvailability };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.checkAvailability(userId);

      expect(result).toBe(false);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return false when availability is null', async () => {
      const mockProfile = { availability: null };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.checkAvailability(userId);

      expect(result).toBe(false);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return false when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      const result = await service.checkAvailability(userId);

      expect(result).toBe(false);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return false when availability object exists but available field is undefined', async () => {
      const mockAvailability = { hours: '9-5', timezone: 'UTC+3' };
      const mockProfile = { availability: mockAvailability };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.checkAvailability(userId);

      expect(result).toBe(false);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should return false when availability object exists but available field is null', async () => {
      const mockAvailability = { available: null, hours: '9-5' };
      const mockProfile = { availability: mockAvailability };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.checkAvailability(userId);

      expect(result).toBe(false);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.checkAvailability(userId)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { availability: true },
      });
    });
  });

  describe('Edge cases and error scenarios', () => {
    const userId = 'test-user-id';

    it('should handle very large availability data', async () => {
      const largeAvailabilityData = {
        available: true,
        hours: 'A'.repeat(1000),
        timezone: 'B'.repeat(500),
        noticePeriod: 'C'.repeat(300),
        maxHoursPerWeek: 999,
        preferredProjectTypes: Array.from({ length: 100 }, (_, i) => `project-${i}`),
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: largeAvailabilityData };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, largeAvailabilityData);

      expect(result).toEqual(largeAvailabilityData);
    });

    it('should handle very large work preferences data', async () => {
      const largeWorkPreferencesData = {
        remoteWork: true,
        onSiteWork: true,
        hybridWork: true,
        travelWillingness: 'A'.repeat(500),
        contractTypes: Array.from({ length: 50 }, (_, i) => `contract-${i}`),
        minProjectDuration: 'B'.repeat(300),
        maxProjectDuration: 'C'.repeat(300),
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, workPreferences: largeWorkPreferencesData };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateWorkPreferences(userId, largeWorkPreferencesData);

      expect(result).toEqual(largeWorkPreferencesData);
    });

    it('should handle empty arrays in availability data', async () => {
      const availabilityData = {
        available: true,
        preferredProjectTypes: [],
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: availabilityData };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, availabilityData);

      expect(result).toEqual(availabilityData);
    });

    it('should handle empty arrays in work preferences data', async () => {
      const workPreferencesData = {
        remoteWork: true,
        contractTypes: [],
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, workPreferences: workPreferencesData };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateWorkPreferences(userId, workPreferencesData);

      expect(result).toEqual(workPreferencesData);
    });

    it('should handle special characters in string fields', async () => {
      const specialCharData = {
        available: true,
        hours: '9-5 (EST) 🕐',
        timezone: 'UTC+3 (Europe/Athens)',
        noticePeriod: '2 weeks & 3 days',
        preferredProjectTypes: ['web-dev', 'mobile-app', 'API/backend'],
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: specialCharData };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, specialCharData);

      expect(result).toEqual(specialCharData);
    });

    it('should handle nested objects in data', async () => {
      const nestedData = {
        available: true,
        hours: '9-5',
        nestedObject: {
          key1: 'value1',
          key2: {
            nestedKey: 'nestedValue',
            array: [1, 2, 3],
          },
        },
      };
      const mockProfile = { id: 'profile-id', userId };
      const mockUpdatedProfile = { ...mockProfile, availability: nestedData };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.updateAvailability(userId, nestedData);

      expect(result).toEqual(nestedData);
    });

    it('should handle multiple consecutive updates', async () => {
      const mockProfile = { id: 'profile-id', userId };
      
      // First update
      const firstUpdate = { available: true, hours: '9-5' };
      const firstUpdatedProfile = { ...mockProfile, availability: firstUpdate };
      
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(firstUpdatedProfile);

      const firstResult = await service.updateAvailability(userId, firstUpdate);
      expect(firstResult).toEqual(firstUpdate);

      // Second update
      const secondUpdate = { available: false, timezone: 'UTC+5' };
      const secondUpdatedProfile = { ...mockProfile, availability: secondUpdate };
      
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(secondUpdatedProfile);

      const secondResult = await service.updateAvailability(userId, secondUpdate);
      expect(secondResult).toEqual(secondUpdate);

      // Verify both updates were called
      expect(prismaService.profile.update).toHaveBeenCalledTimes(2);
    });
  });
});
