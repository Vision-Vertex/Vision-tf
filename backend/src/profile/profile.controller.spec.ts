import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto/update-developer-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto/update-client-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto/update-admin-profile.dto';
import { UserRole } from '@prisma/client';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: jest.Mocked<ProfileService>;

  const mockProfileService = {
    updateProfile: jest.fn(),
    updateDeveloperProfile: jest.fn(),
    updateClientProfile: jest.fn(),
    updateAdminProfile: jest.fn(),
    uploadProfilePicture: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRateLimitGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Arrange
      const mockDto = new UpdateProfileDto();
      mockDto.displayName = 'John Doe';
      mockDto.bio = 'Test bio';

      const mockResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: { displayName: 'John Doe', bio: 'Test bio' },
      };

      profileService.updateProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateProfile(
        { user: { userId: 'user-123' } },
        mockDto,
      );

      // Assert
      expect(profileService.updateProfile).toHaveBeenCalledWith('user-123', mockDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateDeveloperProfile', () => {
    it('should update developer profile successfully', async () => {
      // Arrange
      const mockDto = new UpdateDeveloperProfileDto();
      mockDto.skills = ['JavaScript', 'React'];
      mockDto.experience = 5;

      const mockResponse = {
        success: true,
        message: 'Developer profile updated successfully',
        data: { skills: ['JavaScript', 'React'], experience: 5 },
      };

      profileService.updateDeveloperProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateDeveloperProfile(
        { user: { userId: 'user-123' } },
        mockDto,
      );

      // Assert
      expect(profileService.updateDeveloperProfile).toHaveBeenCalledWith('user-123', mockDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateClientProfile', () => {
    it('should update client profile successfully', async () => {
      // Arrange
      const mockDto = new UpdateClientProfileDto();
      mockDto.companyName = 'Test Company';
      mockDto.industry = 'Technology';

      const mockResponse = {
        success: true,
        message: 'Client profile updated successfully',
        data: { companyName: 'Test Company', industry: 'Technology' },
      };

      profileService.updateClientProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateClientProfile(
        { user: { userId: 'user-123' } },
        mockDto,
      );

      // Assert
      expect(profileService.updateClientProfile).toHaveBeenCalledWith('user-123', mockDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateAdminProfile', () => {
    it('should update admin profile successfully', async () => {
      // Arrange
      const mockDto = new UpdateAdminProfileDto();
      mockDto.department = 'IT';
      mockDto.permissions = ['user_management'];

      const mockResponse = {
        success: true,
        message: 'Admin profile updated successfully',
        data: { department: 'IT', permissions: ['user_management'] },
      };

      profileService.updateAdminProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateAdminProfile(
        { user: { userId: 'user-123' } },
        mockDto,
      );

      // Assert
      expect(profileService.updateAdminProfile).toHaveBeenCalledWith('user-123', mockDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture successfully', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024,
        buffer: Buffer.from('fake-image-data'),
      } as any;

      const mockResponse = {
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePictureUrl: '/uploads/profile-pictures/profile-picture-user-123-1234567890.jpg',
          fileName: 'profile-picture-user-123-1234567890.jpg',
          fileSize: 1024 * 1024,
        },
      };

      profileService.uploadProfilePicture.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.uploadProfilePicture(
        { user: { userId: 'user-123' } },
        mockFile,
      );

      // Assert
      expect(profileService.uploadProfilePicture).toHaveBeenCalledWith('user-123', mockFile);
      expect(result).toEqual(mockResponse);
    });
  });
});



