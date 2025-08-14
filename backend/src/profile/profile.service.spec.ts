import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SuccessResponse } from '../common/dto/api-response.dto';
import isURL from 'validator/lib/isURL';


jest.mock('validator/lib/isURL');


const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  profile: {
    update: jest.fn(),
  },
};

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateClientProfile', () => {
    it('should throw if user is not a client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'ADMIN' });

      await expect(
        service.updateClientProfile('1', { companyName: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update client profile successfully', async () => {
      const dto = { displayName: 'Client Name', location: { city: 'NY' } };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '1' });

      const result = await service.updateClientProfile('1', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Client profile updated successfully');
    });
  });

  describe('updateDeveloperProfile', () => {
    it('should throw if user is not a developer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '2', role: 'CLIENT' });

      await expect(
        service.updateDeveloperProfile('2', { experience: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw on invalid portfolio URL', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '2', role: 'DEVELOPER' });

      const dto = {
        portfolioLinks: {
          github: 'invalid-url',
        },
      };

      // Inject a mock isValidUrl method
      (isURL as jest.Mock).mockReturnValue(false);


      await expect(service.updateDeveloperProfile('2', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update developer profile successfully', async () => {
      const dto = {
        displayName: 'Dev Name',
        portfolioLinks: {
          github: 'https://github.com/dev',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: '2', role: 'DEVELOPER' });
      (isURL as jest.Mock).mockReturnValue(true);
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '2' });

      const result = await service.updateDeveloperProfile('2', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Developer profile updated successfully');
    });
  });

  describe('updateProfile', () => {
   it('should throw on invalid profile picture URL', async () => {
  mockPrisma.user.findUnique.mockResolvedValue({ id: '3' });

  (isURL as jest.Mock).mockReturnValue(false);  // MOCK here

  await expect(
    service.updateProfile('3', { profilePictureUrl: 'invalid-url' }),
  ).rejects.toThrow(BadRequestException);
});


    it('should throw on invalid profile picture URL', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '3' });

      await expect(
        service.updateProfile('3', { profilePictureUrl: 'invalid-url' }),
        
      ).rejects.toThrow(BadRequestException);
    });

    it('should update profile successfully', async () => {
      const dto = { displayName: 'Updated Name' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '3' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '3' });

    const result = await service.updateProfile('3', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Profile updated successfully');
    });
  });

  describe('updateAdminProfile', () => {
    it('should throw if user is not an admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '4', role: 'CLIENT' });

      await expect(
        service.updateAdminProfile('4', { companyName: 'Admin' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update admin profile successfully', async () => {
     const dto = {
  displayName: 'Admin Name',
  systemRole: 'SUPER',
  permissions: ['ALL'],
  lastSystemAccess: new Date().toISOString(), // string, not Date object
  adminPreferences: {
    dashboardLayout: 'compact',
    notificationSettings: {
      emailNotifications: true,
      systemAlerts: false,
      userReports: false,
      securityAlerts: false,
    },
    defaultTimezone: 'UTC',
  },
};

      mockPrisma.user.findUnique.mockResolvedValue({ id: '4', role: 'ADMIN' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '4' });

      const result = await service.updateAdminProfile('4', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Admin profile updated successfully');
    });
  });
});