import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityProfileController } from './availability-profile.controller';
import { AvailabilityProfileService } from './availability-profile.service';
import {
  AvailabilityDto,
  WorkPreferencesDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { BadRequestException } from '@nestjs/common';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';

describe('AvailabilityProfileController', () => {
  let controller: AvailabilityProfileController;
  let service: jest.Mocked<AvailabilityProfileService>;

  const mockAvailability: AvailabilityDto = {
    available: true,
    hours: '9:00-17:00',
    timezone: 'UTC+3',
    noticePeriod: '2 weeks',
    maxHoursPerWeek: 40,
    preferredProjectTypes: ['web', 'mobile'],
  };

  const mockWorkPreferences: WorkPreferencesDto = {
    remoteWork: true,
    onSiteWork: false,
    hybridWork: true,
    travelWillingness: 'national',
    contractTypes: ['hourly', 'fixed'],
    minProjectDuration: '1-2 weeks',
    maxProjectDuration: '6+ months',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityProfileController],
      providers: [
        {
          provide: AvailabilityProfileService,
          useValue: {
            updateAvailability: jest.fn().mockResolvedValue(mockAvailability),
            updateWorkPreferences: jest
              .fn()
              .mockResolvedValue(mockWorkPreferences),
            getAvailability: jest.fn().mockResolvedValue(mockAvailability),
            getWorkPreferences: jest
              .fn()
              .mockResolvedValue(mockWorkPreferences),
            checkAvailability: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AvailabilityProfileController>(
      AvailabilityProfileController,
    );
    service = module.get(AvailabilityProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateAvailability', () => {
    it('should update availability successfully', async () => {
      const mockReq = { user: { userId: 'user123' } };
      const result = await controller.updateAvailability(
        mockReq,
        mockAvailability,
      );

      expect(service.updateAvailability).toHaveBeenCalledWith(
        'user123',
        mockAvailability,
      );
      expect(result).toEqual(mockAvailability);
    });

    it('should handle service errors', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.updateAvailability.mockRejectedValue(
        new BadRequestException('Invalid data'),
      );

      await expect(
        controller.updateAvailability(mockReq, mockAvailability),
      ).rejects.toThrow(BadRequestException);
      expect(service.updateAvailability).toHaveBeenCalledWith(
        'user123',
        mockAvailability,
      );
    });
  });

  describe('updateWorkPreferences', () => {
    it('should update work preferences successfully', async () => {
      const mockReq = { user: { userId: 'user123' } };
      const result = await controller.updateWorkPreferences(
        mockReq,
        mockWorkPreferences,
      );

      expect(service.updateWorkPreferences).toHaveBeenCalledWith(
        'user123',
        mockWorkPreferences,
      );
      expect(result).toEqual(mockWorkPreferences);
    });

    it('should handle service errors', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.updateWorkPreferences.mockRejectedValue(
        new BadRequestException('Invalid data'),
      );

      await expect(
        controller.updateWorkPreferences(mockReq, mockWorkPreferences),
      ).rejects.toThrow(BadRequestException);
      expect(service.updateWorkPreferences).toHaveBeenCalledWith(
        'user123',
        mockWorkPreferences,
      );
    });
  });

  describe('getAvailability', () => {
    it('should return availability successfully', async () => {
      const mockReq = { user: { userId: 'user123' } };
      const result = await controller.getAvailability(mockReq);

      expect(service.getAvailability).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockAvailability);
    });

    it('should handle service errors', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.getAvailability.mockRejectedValue(
        new BadRequestException('Database error'),
      );

      await expect(controller.getAvailability(mockReq)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getAvailability).toHaveBeenCalledWith('user123');
    });

    it('should return null when no availability data', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.getAvailability.mockResolvedValue(null);

      const result = await controller.getAvailability(mockReq);
      expect(service.getAvailability).toHaveBeenCalledWith('user123');
      expect(result).toBeNull();
    });
  });

  describe('getWorkPreferences', () => {
    it('should return work preferences successfully', async () => {
      const mockReq = { user: { userId: 'user123' } };
      const result = await controller.getWorkPreferences(mockReq);

      expect(service.getWorkPreferences).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockWorkPreferences);
    });

    it('should handle service errors', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.getWorkPreferences.mockRejectedValue(
        new BadRequestException('Database error'),
      );

      await expect(controller.getWorkPreferences(mockReq)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getWorkPreferences).toHaveBeenCalledWith('user123');
    });

    it('should return null when no work preferences data', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.getWorkPreferences.mockResolvedValue(null);

      const result = await controller.getWorkPreferences(mockReq);
      expect(service.getWorkPreferences).toHaveBeenCalledWith('user123');
      expect(result).toBeNull();
    });
  });

  describe('checkAvailability', () => {
    it('should return availability status when user is available', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.checkAvailability.mockResolvedValue(true);

      const result = await controller.checkAvailability(mockReq);

      expect(service.checkAvailability).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        available: true,
        message: 'Developer is currently available',
      });
    });

    it('should return availability status when user is not available', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.checkAvailability.mockResolvedValue(false);

      const result = await controller.checkAvailability(mockReq);

      expect(service.checkAvailability).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        available: false,
        message: 'Developer is not currently available',
      });
    });

    it('should handle service errors', async () => {
      const mockReq = { user: { userId: 'user123' } };
      service.checkAvailability.mockRejectedValue(
        new BadRequestException('Check failed'),
      );

      await expect(controller.checkAvailability(mockReq)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.checkAvailability).toHaveBeenCalledWith('user123');
    });
  });
});
