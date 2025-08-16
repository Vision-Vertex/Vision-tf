import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SuccessResponse } from '../common/dto/api-response.dto';
import isURL from 'validator/lib/isURL';
import { AuditService } from './services/audit.service';
import { ProfileCompletionService } from './services/profile-completion.service';
import { UserRole } from '@prisma/client';

jest.mock('validator/lib/isURL');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  profile: {
    update: jest.fn(),
  },
};

const mockAuditService = {
  logProfileUpdate: jest.fn(),
  logProfileChange: jest.fn(),
  logAdminProfileUpdate: jest.fn(),
  logProfileView: jest.fn(),
  getAuditLogs: jest.fn(),
};

const mockCompletionService = {
  calculateCompletion: jest.fn(),
  validateProfile: jest.fn(),
  getRequiredFields: jest.fn(),
};

describe('ProfileService', () => {
  let service: ProfileService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let completionService: ProfileCompletionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: ProfileCompletionService,
          useValue: mockCompletionService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    completionService = module.get<ProfileCompletionService>(
      ProfileCompletionService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const dto = {
        displayName: 'John Doe',
        bio: 'This is a longer bio that meets the minimum requirement',
      };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '1' });

      const result = await service.updateProfile('1', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Profile updated successfully');
    });

    it('should throw NotFoundException when user not found', async () => {
      const dto = { displayName: 'John Doe' };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate profile picture URL', async () => {
      const dto = { profilePictureUrl: 'invalid-url' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      (isURL as jest.Mock).mockReturnValue(false);

      await expect(service.updateProfile('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate display name length', async () => {
      const dto = { displayName: 'A' }; // Too short
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });

      await expect(service.updateProfile('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate bio length', async () => {
      const dto = { bio: 'A'.repeat(501) }; // Too long
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });

      await expect(service.updateProfile('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateDeveloperProfile', () => {
    it('should throw if user is not a developer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '2', role: 'CLIENT' });

      await expect(
        service.updateDeveloperProfile('2', { experience: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update developer profile successfully', async () => {
      const dto = {
        displayName: 'Dev Name',
        portfolioLinks: {
          github: 'https://github.com/dev',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '2',
        role: 'DEVELOPER',
      });
      (isURL as jest.Mock).mockReturnValue(true);
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '2' });

      const result = await service.updateDeveloperProfile('2', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Developer profile updated successfully');
    });

    it('should validate portfolio URLs in batch', async () => {
      const dto = {
        portfolioLinks: {
          github: 'invalid-url',
          linkedin: 'https://linkedin.com/valid',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '2',
        role: 'DEVELOPER',
      });
      (isURL as jest.Mock).mockImplementation(
        (url) => url === 'https://linkedin.com/valid',
      );

      await expect(service.updateDeveloperProfile('2', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user not found', async () => {
      const dto = { experience: 5 };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateDeveloperProfile('2', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
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
      mockAuditService.logProfileUpdate.mockResolvedValue(undefined);

      const result = await service.updateClientProfile('1', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Client profile updated successfully');
      expect(mockAuditService.logProfileUpdate).toHaveBeenCalledWith(
        '1',
        expect.any(Object),
        {
          operation: 'client_profile_update',
          fieldsUpdated: expect.any(Array),
        },
      );
    });

    it('should sanitize input data', async () => {
      const dto = {
        companyName: '  Test Company<script>  ',
        companyDescription: 'Description with <script>alert("xss")</script>',
      };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '1' });
      mockAuditService.logProfileUpdate.mockResolvedValue(undefined);

      const result = await service.updateClientProfile('1', dto);

      // Verify sanitization occurred
      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { userId: '1' },
        data: expect.objectContaining({
          companyName: 'Test Company<script>',
          companyDescription: 'Description with ',
        }),
      });
    });

    it('should handle Prisma P2025 error', async () => {
      const dto = { companyName: 'Test' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      mockPrisma.profile.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.updateClientProfile('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle Prisma P2002 error', async () => {
      const dto = { companyName: 'Test' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      mockPrisma.profile.update.mockRejectedValue({ code: 'P2002' });

      await expect(service.updateClientProfile('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unknown Prisma error', async () => {
      const dto = { companyName: 'Test' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });
      mockPrisma.profile.update.mockRejectedValue({ code: 'UNKNOWN' });

      await expect(service.updateClientProfile('1', dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateAdminProfile', () => {
    it('should throw if user is not an admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'CLIENT' });

      await expect(
        service.updateAdminProfile('1', { systemRole: 'SYSTEM_ADMIN' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update admin profile successfully', async () => {
      const dto = { systemRole: 'SYSTEM_ADMIN' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'ADMIN' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '1' });

      const result = await service.updateAdminProfile('1', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Admin profile updated successfully');
    });

    it('should handle nested admin preferences', async () => {
      const dto = {
        adminPreferences: {
          dashboardLayout: 'compact',
          notificationSettings: {
            emailNotifications: true,
          },
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'ADMIN' });
      mockPrisma.profile.update.mockResolvedValue({ ...dto, userId: '1' });

      const result = await service.updateAdminProfile('1', dto);
      expect(result).toBeInstanceOf(SuccessResponse);
    });
  });

  describe('getMyProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'DEVELOPER',
        profile: {
          displayName: 'John Doe',
          skills: ['JavaScript'],
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMyProfile('1');
      expect(result).toEqual({
        userId: '1',
        email: 'test@example.com',
        role: 'DEVELOPER',
        profile: {
          displayName: 'John Doe',
          bio: undefined,
          profilePictureUrl: undefined,
          chatLastReadAt: undefined,
          skills: ['JavaScript'],
          experience: undefined,
          hourlyRate: undefined,
          currency: undefined,
          availability: undefined,
          portfolioLinks: undefined,
          education: undefined,
          workPreferences: undefined,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle different user roles correctly', async () => {
      const mockClient = {
        id: '1',
        email: 'client@example.com',
        role: 'CLIENT',
        profile: {
          companyName: 'Test Company',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockClient);

      const result = await service.getMyProfile('1');
      expect(result.role).toBe('CLIENT');
      expect(result.profile).toHaveProperty('companyName', 'Test Company');
    });
  });

  describe('getProfileCompletion', () => {
    it('should get profile completion successfully', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.DEVELOPER,
        profile: {
          displayName: 'John Doe',
          bio: 'Experienced developer',
          skills: ['JavaScript', 'React'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: { city: 'New York' },
          contactEmail: 'john@example.com',
          updatedAt: '2025-01-15T10:30:00Z', // Changed to string
        },
      };

      const mockCompletion = {
        overall: 85,
        breakdown: {
          basic: 100,
          professional: 80,
          availability: 100,
          contact: 100,
        },
        missingFields: [],
        suggestions: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.calculateCompletion.mockReturnValue(mockCompletion);

      const result = await service.getProfileCompletion('user-1');

      expect(result.completion).toEqual(mockCompletion);
      expect(result.userId).toBe('user-1');
      expect(typeof result.lastUpdated).toBe('string');
      expect(result.lastUpdated).toBe('2025-01-15T10:30:00Z');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          role: true,
          profile: true,
        },
      });

      expect(mockCompletionService.calculateCompletion).toHaveBeenCalledWith(
        mockUser.profile,
      );
    });

    it('should handle user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getProfileCompletion('non-existent'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        select: {
          id: true,
          role: true,
          profile: true,
        },
      });
    });

    it('should handle profile without updatedAt', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.DEVELOPER,
        profile: {
          displayName: 'John Doe',
          updatedAt: null,
        },
      };

      const mockCompletion = {
        overall: 25,
        breakdown: { basic: 50, professional: 0, availability: 0, contact: 0 },
        missingFields: ['skills', 'experience', 'hourlyRate'],
        suggestions: ['Add your skills', 'Add your experience'],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.calculateCompletion.mockReturnValue(mockCompletion);

      const result = await service.getProfileCompletion('user-1');

      expect(result.lastUpdated).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(result.completion).toEqual(mockCompletion);
    });
  });

  describe('validateProfile', () => {
    it('should validate profile successfully', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.DEVELOPER,
        profile: {
          displayName: 'John Doe',
          bio: 'Experienced developer',
          skills: ['JavaScript', 'React'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: { city: 'New York' },
          contactEmail: 'john@example.com',
        },
      };

      const mockValidation = {
        isValid: true,
        validFieldsCount: 8,
        invalidFieldsCount: 0,
        totalFieldsCount: 8,
        validationPercentage: 100,
        fieldValidations: [
          {
            field: 'displayName',
            isValid: true,
            value: 'John Doe',
            required: true,
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.validateProfile.mockReturnValue(mockValidation);

      const result = await service.validateProfile('user-1');

      expect(result).toEqual({
        ...mockValidation,
        userId: 'user-1',
        validatedAt: expect.any(String),
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          role: true,
          profile: true,
        },
      });

      expect(mockCompletionService.validateProfile).toHaveBeenCalledWith(
        mockUser.profile,
        UserRole.DEVELOPER,
      );
    });

    it('should handle user not found for validation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle validation with errors', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.DEVELOPER,
        profile: {
          displayName: 'John Doe',
          bio: 'Short', // Too short
          skills: [],
          experience: 5,
          hourlyRate: 50,
          availability: null,
          location: null,
          contactEmail: 'invalid-email',
        },
      };

      const mockValidation = {
        isValid: false,
        validFieldsCount: 3,
        invalidFieldsCount: 5,
        totalFieldsCount: 8,
        validationPercentage: 38,
        fieldValidations: [
          {
            field: 'displayName',
            isValid: true,
            value: 'John Doe',
            required: true,
          },
          {
            field: 'bio',
            isValid: false,
            errorMessage: 'Minimum length is 10 characters',
            value: 'Short',
            required: true,
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.validateProfile.mockReturnValue(mockValidation);

      const result = await service.validateProfile('user-1');

      expect(result.isValid).toBe(false);
      expect(result.validFieldsCount).toBe(3);
      expect(result.invalidFieldsCount).toBe(5);
      expect(result.validationPercentage).toBe(38);
    });
  });

  describe('getRequiredFields', () => {
    it('should get required fields successfully', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.DEVELOPER,
        profile: {
          displayName: 'John Doe',
          bio: 'Experienced developer',
          skills: ['JavaScript'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: { city: 'New York' },
          contactEmail: 'john@example.com',
        },
      };

      const mockRequiredFields = {
        role: 'DEVELOPER',
        requiredFields: [
          {
            field: 'displayName',
            displayName: 'Display Name',
            description: 'Your public display name',
            category: 'basic',
            required: true,
            type: 'string',
            validationRules: { minLength: 2, maxLength: 50 },
          },
        ],
        totalRequiredFields: 8,
        completedRequiredFields: 8,
        requiredFieldsCompletion: 100,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.getRequiredFields.mockReturnValue(
        mockRequiredFields,
      );

      const result = await service.getRequiredFields('user-1');

      expect(result).toEqual(mockRequiredFields);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          role: true,
          profile: true,
        },
      });

      expect(mockCompletionService.getRequiredFields).toHaveBeenCalledWith(
        UserRole.DEVELOPER,
        mockUser.profile,
      );
    });

    it('should handle user not found for required fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getRequiredFields('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle client role required fields', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.CLIENT,
        profile: {
          displayName: 'Acme Corp',
          bio: 'Leading technology company',
          companyName: 'Acme Corporation',
          companyDescription: 'Comprehensive description',
          contactEmail: 'contact@acme.com',
          contactPhone: '+1234567890',
        },
      };

      const mockRequiredFields = {
        role: 'CLIENT',
        requiredFields: [
          {
            field: 'displayName',
            displayName: 'Display Name',
            description: 'Your public display name',
            category: 'basic',
            required: true,
            type: 'string',
            validationRules: { minLength: 2, maxLength: 50 },
          },
        ],
        totalRequiredFields: 6,
        completedRequiredFields: 6,
        requiredFieldsCompletion: 100,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.getRequiredFields.mockReturnValue(
        mockRequiredFields,
      );

      const result = await service.getRequiredFields('user-1');

      expect(result.role).toBe('CLIENT');
      expect(result.totalRequiredFields).toBe(6);
      expect(result.completedRequiredFields).toBe(6);
      expect(result.requiredFieldsCompletion).toBe(100);
    });

    it('should handle admin role required fields', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.ADMIN,
        profile: {
          displayName: 'Admin User',
          bio: 'System administrator',
          contactEmail: 'admin@example.com',
        },
      };

      const mockRequiredFields = {
        role: 'ADMIN',
        requiredFields: [
          {
            field: 'displayName',
            displayName: 'Display Name',
            description: 'Your public display name',
            category: 'basic',
            required: true,
            type: 'string',
            validationRules: { minLength: 2, maxLength: 50 },
          },
        ],
        totalRequiredFields: 3,
        completedRequiredFields: 3,
        requiredFieldsCompletion: 100,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCompletionService.getRequiredFields.mockReturnValue(
        mockRequiredFields,
      );

      const result = await service.getRequiredFields('user-1');

      expect(result.role).toBe('ADMIN');
      expect(result.totalRequiredFields).toBe(3);
      expect(result.completedRequiredFields).toBe(3);
      expect(result.requiredFieldsCompletion).toBe(100);
    });
  });
});
