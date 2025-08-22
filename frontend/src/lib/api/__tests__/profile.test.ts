import { vi, describe, it, expect, beforeEach } from 'vitest';
import { profileApi } from '../profile';
import { apiClient } from '../client';
import { handleApiResponse } from '../client';
import { handleApiError } from '@/lib/utils/api';

// Mock the API client and utilities
vi.mock('../client');
vi.mock('@/lib/utils/api');

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockHandleApiResponse = handleApiResponse as ReturnType<typeof vi.fn>;
const mockHandleApiError = handleApiError as unknown as ReturnType<typeof vi.fn>;

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Fetching', () => {
    it('should fetch profile successfully', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        bio: 'Developer',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should fetch developer profile successfully', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        bio: 'Developer',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.getDeveloperProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should fetch client profile successfully', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        companyName: 'Tech Corp',
        companyWebsite: 'https://techcorp.com',
        contactEmail: 'contact@techcorp.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.getClientProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should handle profile fetch error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);
      mockHandleApiError.mockImplementation(() => {
        throw error;
      });

      await expect(profileApi.getProfile()).rejects.toThrow('Network error');
      expect(mockHandleApiError).toHaveBeenCalledWith(error);
    });
  });

  describe('Profile Updates', () => {
    it('should update developer profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        skills: ['JavaScript', 'React', 'Vue'],
        experience: 6,
        hourlyRate: 80,
      };

      const mockProfile = {
        id: '1',
        userId: 'user1',
        ...updateData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.patch.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.updateDeveloperProfile(updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/profile/developer', updateData);
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should update client profile successfully', async () => {
      const updateData = {
        companyName: 'Updated Company',
        companyWebsite: 'https://updated.com',
        contactEmail: 'updated@company.com',
      };

      const mockProfile = {
        id: '1',
        userId: 'user1',
        ...updateData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.patch.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.updateClientProfile(updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/profile/client', updateData);
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should update general profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      const mockProfile = {
        id: '1',
        userId: 'user1',
        ...updateData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.patch.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.updateProfile(updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/profile', updateData);
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('Profile Completion', () => {
    it('should fetch developer profile completion successfully', async () => {
      const mockCompletion = {
        completion: {
          overall: 75,
          breakdown: {
            basic: 80,
            professional: 70,
            availability: 60,
            contact: 90,
          },
          missingFields: ['skills', 'experience'],
          suggestions: ['Add your skills', 'Add your experience'],
        },
        userId: 'user1',
        lastUpdated: '2024-01-01T00:00:00Z',
      };

      const mockResponse = { data: mockCompletion };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockCompletion);

      const result = await profileApi.getDeveloperProfileCompletion();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/developer/completion');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockCompletion);
    });

    it('should fetch client profile completion successfully', async () => {
      const mockCompletion = {
        completion: {
          overall: 60,
          breakdown: {
            basic: 70,
            professional: 50,
            contact: 80,
          },
          missingFields: ['companyName', 'contactPhone'],
          suggestions: ['Add your company name', 'Add your contact phone'],
        },
        userId: 'user1',
        lastUpdated: '2024-01-01T00:00:00Z',
      };

      const mockResponse = { data: mockCompletion };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockCompletion);

      const result = await profileApi.getClientProfileCompletion();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/client/completion');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockCompletion);
    });
  });

  describe('Profile Validation', () => {
    it('should validate developer profile successfully', async () => {
      const mockValidation = {
        isValid: false,
        validFieldsCount: 6,
        invalidFieldsCount: 2,
        totalFieldsCount: 8,
        validationPercentage: 75,
        fieldValidations: [
          {
            field: 'displayName',
            isValid: true,
            value: 'John Doe',
            required: true,
          },
          {
            field: 'skills',
            isValid: false,
            errorMessage: 'Skills are required',
            value: '',
            required: true,
          },
        ],
        userId: 'user1',
        validatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = { data: mockValidation };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockValidation);

      const result = await profileApi.validateDeveloperProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/developer/validation');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockValidation);
    });

    it('should validate client profile successfully', async () => {
      const mockValidation = {
        isValid: true,
        validFieldsCount: 8,
        invalidFieldsCount: 0,
        totalFieldsCount: 8,
        validationPercentage: 100,
        fieldValidations: [
          {
            field: 'companyName',
            isValid: true,
            value: 'Tech Corp',
            required: true,
          },
          {
            field: 'contactEmail',
            isValid: true,
            value: 'contact@techcorp.com',
            required: true,
          },
        ],
        userId: 'user1',
        validatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = { data: mockValidation };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockValidation);

      const result = await profileApi.validateClientProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/client/validation');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockValidation);
    });
  });

  describe('Required Fields', () => {
    it('should fetch developer required fields successfully', async () => {
      const mockRequiredFields = {
        requiredFields: [
          {
            field: 'displayName',
            displayName: 'Display Name',
            description: 'Your public display name',
            category: 'basic',
            required: true,
            type: 'string',
          },
          {
            field: 'skills',
            displayName: 'Skills',
            description: 'Your technical skills',
            category: 'professional',
            required: true,
            type: 'array',
          },
        ],
        completionStatus: {
          displayName: true,
          skills: false,
        },
        userId: 'user1',
      };

      const mockResponse = { data: mockRequiredFields };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockRequiredFields);

      const result = await profileApi.getDeveloperRequiredFields();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/developer/required-fields');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockRequiredFields);
    });

    it('should fetch client required fields successfully', async () => {
      const mockRequiredFields = {
        requiredFields: [
          {
            field: 'companyName',
            displayName: 'Company Name',
            description: 'Your company name',
            category: 'professional',
            required: true,
            type: 'string',
          },
          {
            field: 'contactEmail',
            displayName: 'Contact Email',
            description: 'Your contact email',
            category: 'contact',
            required: true,
            type: 'string',
          },
        ],
        completionStatus: {
          companyName: true,
          contactEmail: true,
        },
        userId: 'user1',
      };

      const mockResponse = { data: mockRequiredFields };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockRequiredFields);

      const result = await profileApi.getClientRequiredFields();

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/client/required-fields');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockRequiredFields);
    });
  });

  describe('Skill Management', () => {
    it('should add skill successfully', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        skills: ['JavaScript', 'React', 'Vue.js'],
        experience: 5,
        hourlyRate: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.post.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.addSkill('Vue.js');

      expect(mockApiClient.post).toHaveBeenCalledWith('/profile/developer/skills/add', { skill: 'Vue.js' });
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should remove skill successfully', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        skills: ['React', 'TypeScript'],
        experience: 5,
        hourlyRate: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.delete.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.removeSkill('JavaScript');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/profile/developer/skills/JavaScript');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('Profile Picture Upload', () => {
    it('should upload profile picture successfully', async () => {
      const mockResponse = { profilePictureUrl: 'https://example.com/new-avatar.jpg' };
      const apiResponse = { data: mockResponse };
      mockApiClient.post.mockResolvedValue(apiResponse);
      mockHandleApiResponse.mockReturnValue(mockResponse);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await profileApi.uploadProfilePicture(file);

      expect(mockApiClient.post).toHaveBeenCalledWith('/profile/picture/upload', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(mockHandleApiResponse).toHaveBeenCalledWith(apiResponse);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Search and Other Operations', () => {
    it('should search profiles successfully', async () => {
      const mockProfiles = [
        {
          id: '1',
          userId: 'user1',
          displayName: 'John Doe',
          skills: ['JavaScript', 'React'],
          experience: 5,
          hourlyRate: 50,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          education: {},
          location: {},
          projectPreferences: {},
          socialLinks: {},
          workPreferences: {},
          availability: {},
          portfolioLinks: {},
          billingAddress: {},
        },
      ];

      const mockResponse = { data: mockProfiles };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfiles);

      const result = await profileApi.searchProfiles('JavaScript', { experience: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/search?query=JavaScript&experience=5');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfiles);
    });

    it('should get profile by ID successfully', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: {},
        portfolioLinks: {},
        billingAddress: {},
      };

      const mockResponse = { data: mockProfile };
      mockApiClient.get.mockResolvedValue(mockResponse);
      mockHandleApiResponse.mockReturnValue(mockProfile);

      const result = await profileApi.getProfileById('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/1');
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockProfile);
    });

    it('should delete profile successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await profileApi.deleteProfile('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/profile/1');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors properly', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);
      mockHandleApiError.mockImplementation(() => {
        throw error;
      });

      await expect(profileApi.getProfile()).rejects.toThrow('API Error');
      expect(mockHandleApiError).toHaveBeenCalledWith(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      mockApiClient.get.mockRejectedValue(error);
      mockHandleApiError.mockImplementation(() => {
        throw error;
      });

      await expect(profileApi.getDeveloperProfile()).rejects.toThrow('Network Error');
      expect(mockHandleApiError).toHaveBeenCalledWith(error);
    });
  });
});
