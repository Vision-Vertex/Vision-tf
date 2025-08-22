import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from '../profile';
import { profileApi } from '@/lib/api/profile';

// Mock the profile API
vi.mock('@/lib/api/profile');

// Mock the auth store
vi.mock('../auth', () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: 'user1', role: 'DEVELOPER' },
      setUser: vi.fn(),
    }),
  },
}));

const mockProfileApi = profileApi as unknown as {
  getProfile: ReturnType<typeof vi.fn>;
  getDeveloperProfile: ReturnType<typeof vi.fn>;
  getClientProfile: ReturnType<typeof vi.fn>;
  updateProfile: ReturnType<typeof vi.fn>;
  updateDeveloperProfile: ReturnType<typeof vi.fn>;
  updateClientProfile: ReturnType<typeof vi.fn>;
  addSkill: ReturnType<typeof vi.fn>;
  removeSkill: ReturnType<typeof vi.fn>;
  uploadProfilePicture: ReturnType<typeof vi.fn>;
  getDeveloperProfileCompletion: ReturnType<typeof vi.fn>;
  getClientProfileCompletion: ReturnType<typeof vi.fn>;
  validateDeveloperProfile: ReturnType<typeof vi.fn>;
  validateClientProfile: ReturnType<typeof vi.fn>;
  getDeveloperRequiredFields: ReturnType<typeof vi.fn>;
  getClientRequiredFields: ReturnType<typeof vi.fn>;
  // Education Management
  getEducation: ReturnType<typeof vi.fn>;
  updateEducation: ReturnType<typeof vi.fn>;
  addCertification: ReturnType<typeof vi.fn>;
  removeCertification: ReturnType<typeof vi.fn>;
  downloadCertificationFile: ReturnType<typeof vi.fn>;
  // Skills Management
  getSkills: ReturnType<typeof vi.fn>;
  updateSkills: ReturnType<typeof vi.fn>;
  getSkillSuggestions: ReturnType<typeof vi.fn>;
  // Availability Management
  getAvailability: ReturnType<typeof vi.fn>;
  updateAvailability: ReturnType<typeof vi.fn>;
  getWorkPreferences: ReturnType<typeof vi.fn>;
  updateWorkPreferences: ReturnType<typeof vi.fn>;
  checkAvailability: ReturnType<typeof vi.fn>;
  // Portfolio Management
  getPortfolioLinks: ReturnType<typeof vi.fn>;
  addPortfolioLink: ReturnType<typeof vi.fn>;
  updatePortfolioLink: ReturnType<typeof vi.fn>;
  removePortfolioLink: ReturnType<typeof vi.fn>;
};

describe('Profile Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    act(() => {
      useProfileStore.getState().clearProfile();
      useProfileStore.getState().clearCompletionData();
      useProfileStore.getState().clearValidationData();
      useProfileStore.getState().clearRequiredFieldsData();
    });
  });

  describe('Basic Profile Operations', () => {
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

      mockProfileApi.getProfile.mockResolvedValue({ 
        userId: 'user1',
        email: 'user@example.com',
        role: 'DEVELOPER',
        profile: mockProfile 
      });

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchProfile();
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle profile fetch error', async () => {
      const error = new Error('Failed to fetch profile');
      mockProfileApi.getProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchProfile();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch profile');
    });

    it('should update developer profile successfully', async () => {
      const initialProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        bio: 'Developer',
        skills: ['JavaScript'],
        experience: 3,
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

      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        bio: 'Developer',
        skills: ['JavaScript', 'React', 'TypeScript'],
        experience: 5,
        hourlyRate: 60,
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

      const updateData = {
        skills: ['JavaScript', 'React', 'TypeScript'],
        experience: 5,
        hourlyRate: 60,
      };

      mockProfileApi.updateDeveloperProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfileStore());

      // Set up initial profile state
      act(() => {
        useProfileStore.setState({ profile: initialProfile });
      });

      await act(async () => {
        await result.current.updateDeveloperProfile(updateData);
      });

      // Wait for state to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update client profile successfully', async () => {
      const initialProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        companyName: 'Old Corp',
        companyDescription: 'Old company',
        contactEmail: 'old@corp.com',
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

      const mockProfile = {
        id: '1',
        userId: 'user1',
        displayName: 'John Doe',
        companyName: 'Tech Corp',
        companyDescription: 'Technology company',
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

      const updateData = {
        companyName: 'Tech Corp',
        companyDescription: 'Technology company',
        contactEmail: 'contact@techcorp.com',
      };

      mockProfileApi.updateClientProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfileStore());

      // Set up initial profile state
      act(() => {
        useProfileStore.setState({ profile: initialProfile });
      });

      await act(async () => {
        await result.current.updateClientProfile(updateData);
      });

      // Wait for state to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Profile Completion Operations', () => {
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

      mockProfileApi.getDeveloperProfileCompletion.mockResolvedValue(mockCompletion);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchDeveloperProfileCompletion();
      });

      expect(result.current.completion).toEqual(mockCompletion);
      expect(result.current.isCompletionLoading).toBe(false);
      expect(result.current.error).toBeNull();
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

      mockProfileApi.getClientProfileCompletion.mockResolvedValue(mockCompletion);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchClientProfileCompletion();
      });

      expect(result.current.completion).toEqual(mockCompletion);
      expect(result.current.isCompletionLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle completion fetch error', async () => {
      const error = new Error('Failed to fetch completion');
      mockProfileApi.getDeveloperProfileCompletion.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchDeveloperProfileCompletion();
      });

      expect(result.current.completion).toBeNull();
      expect(result.current.isCompletionLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch completion');
    });
  });

  describe('Profile Validation Operations', () => {
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

      mockProfileApi.validateDeveloperProfile.mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.validateDeveloperProfile();
      });

      expect(result.current.validation).toEqual(mockValidation);
      expect(result.current.isValidationLoading).toBe(false);
      expect(result.current.error).toBeNull();
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

      mockProfileApi.validateClientProfile.mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.validateClientProfile();
      });

      expect(result.current.validation).toEqual(mockValidation);
      expect(result.current.isValidationLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle validation error', async () => {
      const error = new Error('Failed to validate profile');
      mockProfileApi.validateDeveloperProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.validateDeveloperProfile();
      });

      expect(result.current.validation).toBeNull();
      expect(result.current.isValidationLoading).toBe(false);
      expect(result.current.error).toBe('Failed to validate profile');
    });
  });

  describe('Required Fields Operations', () => {
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

      mockProfileApi.getDeveloperRequiredFields.mockResolvedValue(mockRequiredFields);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchDeveloperRequiredFields();
      });

      expect(result.current.requiredFields).toEqual(mockRequiredFields);
      expect(result.current.isRequiredFieldsLoading).toBe(false);
      expect(result.current.error).toBeNull();
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

      mockProfileApi.getClientRequiredFields.mockResolvedValue(mockRequiredFields);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchClientRequiredFields();
      });

      expect(result.current.requiredFields).toEqual(mockRequiredFields);
      expect(result.current.isRequiredFieldsLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle required fields fetch error', async () => {
      const error = new Error('Failed to fetch required fields');
      mockProfileApi.getDeveloperRequiredFields.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.fetchDeveloperRequiredFields();
      });

      expect(result.current.requiredFields).toBeNull();
      expect(result.current.isRequiredFieldsLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch required fields');
    });
  });

  describe('Education Management', () => {
    it('should get education successfully', async () => {
      const mockEducation = {
        degree: 'Bachelor of Science',
        institution: 'University of Technology',
        year: 2020,
        certifications: [],
      };

      mockProfileApi.getEducation.mockResolvedValue(mockEducation);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const education = await result.current.getEducation();
        expect(education).toEqual(mockEducation);
      });
    });

    it('should update education successfully', async () => {
      const educationData = {
        degree: 'Master of Science',
        institution: 'University of Technology',
        year: 2022,
        certifications: [],
      };

      mockProfileApi.updateEducation.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.updateEducation(educationData);
      });

      expect(mockProfileApi.updateEducation).toHaveBeenCalledWith(educationData);
    });

    it('should add certification successfully', async () => {
      const certificationData = {
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        dateObtained: '2023-06-15',
      };
      const file = new File(['test'], 'cert.pdf', { type: 'application/pdf' });

      mockProfileApi.addCertification.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.addCertification(certificationData, file);
      });

      expect(mockProfileApi.addCertification).toHaveBeenCalledWith(certificationData, file);
    });

    it('should remove certification successfully', async () => {
      mockProfileApi.removeCertification.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.removeCertification('cert-123');
      });

      expect(mockProfileApi.removeCertification).toHaveBeenCalledWith('cert-123');
    });

    it('should download certification file successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockProfileApi.downloadCertificationFile.mockResolvedValue(mockBlob);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const blob = await result.current.downloadCertificationFile('cert-123');
        expect(blob).toEqual(mockBlob);
      });

      expect(mockProfileApi.downloadCertificationFile).toHaveBeenCalledWith('cert-123');
    });
  });

  describe('Skills Management', () => {
    it('should get skills successfully', async () => {
      const mockSkills = ['JavaScript', 'React', 'TypeScript'];
      mockProfileApi.getSkills.mockResolvedValue(mockSkills);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const skills = await result.current.getSkills();
        expect(skills).toEqual(mockSkills);
      });
    });

    it('should update skills successfully', async () => {
      const skills = ['JavaScript', 'React', 'Vue.js'];
      mockProfileApi.updateSkills.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.updateSkills(skills);
      });

      expect(mockProfileApi.updateSkills).toHaveBeenCalledWith(skills);
    });

    it('should get skill suggestions successfully', async () => {
      const mockSuggestions = ['Vue.js', 'Angular', 'Svelte'];
      mockProfileApi.getSkillSuggestions.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const suggestions = await result.current.getSkillSuggestions();
        expect(suggestions).toEqual(mockSuggestions);
      });
    });
  });

  describe('Availability Management', () => {
    it('should get availability successfully', async () => {
      const mockAvailability = {
        available: true,
        hours: '9-5',
        timezone: 'UTC',
      };
      mockProfileApi.getAvailability.mockResolvedValue(mockAvailability);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const availability = await result.current.getAvailability();
        expect(availability).toEqual(mockAvailability);
      });
    });

    it('should update availability successfully', async () => {
      const availability = {
        available: false,
        hours: '10-6',
        timezone: 'EST',
      };
      mockProfileApi.updateAvailability.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.updateAvailability(availability);
      });

      expect(mockProfileApi.updateAvailability).toHaveBeenCalledWith(availability);
    });

    it('should get work preferences successfully', async () => {
      const mockWorkPreferences = {
        remoteWork: true,
        contractType: 'full-time',
        projectDuration: '3-6 months',
      };
      mockProfileApi.getWorkPreferences.mockResolvedValue(mockWorkPreferences);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const workPreferences = await result.current.getWorkPreferences();
        expect(workPreferences).toEqual(mockWorkPreferences);
      });
    });

    it('should update work preferences successfully', async () => {
      const workPreferences = {
        remoteWork: false,
        contractType: 'part-time',
        projectDuration: '1-3 months',
      };
      mockProfileApi.updateWorkPreferences.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.updateWorkPreferences(workPreferences);
      });

      expect(mockProfileApi.updateWorkPreferences).toHaveBeenCalledWith(workPreferences);
    });

    it('should check availability successfully', async () => {
      const mockAvailabilityCheck = {
        available: true,
        message: 'Available for new projects',
      };
      mockProfileApi.checkAvailability.mockResolvedValue(mockAvailabilityCheck);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const availabilityCheck = await result.current.checkAvailability();
        expect(availabilityCheck).toEqual(mockAvailabilityCheck);
      });
    });
  });

  describe('Portfolio Management', () => {
    it('should get portfolio links successfully', async () => {
      const mockPortfolioLinks = {
        github: 'https://github.com/username',
        linkedin: 'https://linkedin.com/in/username',
      };
      mockProfileApi.getPortfolioLinks.mockResolvedValue(mockPortfolioLinks);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        const portfolioLinks = await result.current.getPortfolioLinks();
        expect(portfolioLinks).toEqual(mockPortfolioLinks);
      });
    });

    it('should add portfolio link successfully', async () => {
      const link = {
        label: 'GitHub',
        url: 'https://github.com/username',
      };
      mockProfileApi.addPortfolioLink.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.addPortfolioLink(link);
      });

      expect(mockProfileApi.addPortfolioLink).toHaveBeenCalledWith(link);
    });

    it('should update portfolio link successfully', async () => {
      const link = {
        label: 'GitHub',
        url: 'https://github.com/newusername',
      };
      mockProfileApi.updatePortfolioLink.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.updatePortfolioLink('GitHub', link);
      });

      expect(mockProfileApi.updatePortfolioLink).toHaveBeenCalledWith('GitHub', link);
    });

    it('should remove portfolio link successfully', async () => {
      mockProfileApi.removePortfolioLink.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.removePortfolioLink('GitHub');
      });

      expect(mockProfileApi.removePortfolioLink).toHaveBeenCalledWith('GitHub');
    });
  });

  describe('State Management', () => {
    it('should clear profile data', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile({
          id: '1',
          userId: 'user1',
          displayName: 'John Doe',
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
        });
      });

      expect(result.current.profile).not.toBeNull();

      act(() => {
        result.current.clearProfile();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear completion data', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile({
          id: '1',
          userId: 'user1',
          displayName: 'John Doe',
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
        });
      });

      // Mock completion data
      act(() => {
        useProfileStore.setState({
          completion: {
            completion: { overall: 75, breakdown: {}, missingFields: [], suggestions: [] },
            userId: 'user1',
            lastUpdated: '2024-01-01T00:00:00Z',
          },
        });
      });

      expect(result.current.completion).not.toBeNull();

      act(() => {
        result.current.clearCompletionData();
      });

      expect(result.current.completion).toBeNull();
    });

    it('should clear validation data', () => {
      const { result } = renderHook(() => useProfileStore());

      // Mock validation data
      act(() => {
        useProfileStore.setState({
          validation: {
            isValid: true,
            validFieldsCount: 8,
            invalidFieldsCount: 0,
            totalFieldsCount: 8,
            validationPercentage: 100,
            fieldValidations: [],
            userId: 'user1',
            validatedAt: '2024-01-01T00:00:00Z',
          },
        });
      });

      expect(result.current.validation).not.toBeNull();

      act(() => {
        result.current.clearValidationData();
      });

      expect(result.current.validation).toBeNull();
    });

    it('should clear required fields data', () => {
      const { result } = renderHook(() => useProfileStore());

      // Mock required fields data
      act(() => {
        useProfileStore.setState({
          requiredFields: {
            requiredFields: [],
            completionStatus: {},
            userId: 'user1',
          },
        });
      });

      expect(result.current.requiredFields).not.toBeNull();

      act(() => {
        result.current.clearRequiredFieldsData();
      });

      expect(result.current.requiredFields).toBeNull();
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useProfileStore());

      // Mock error state
      act(() => {
        useProfileStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should set loading state during profile fetch', async () => {
      mockProfileApi.getProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.fetchProfile();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during completion fetch', async () => {
      mockProfileApi.getDeveloperProfileCompletion.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.fetchDeveloperProfileCompletion();
      });

      expect(result.current.isCompletionLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isCompletionLoading).toBe(false);
    });

    it('should set loading state during validation', async () => {
      mockProfileApi.validateDeveloperProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.validateDeveloperProfile();
      });

      expect(result.current.isValidationLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isValidationLoading).toBe(false);
    });

    it('should set loading state during required fields fetch', async () => {
      mockProfileApi.getDeveloperRequiredFields.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.fetchDeveloperRequiredFields();
      });

      expect(result.current.isRequiredFieldsLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isRequiredFieldsLoading).toBe(false);
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

      mockProfileApi.addSkill.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.addSkill('Vue.js');
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
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

      mockProfileApi.removeSkill.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.removeSkill('JavaScript');
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Profile Picture Upload', () => {
    it('should upload profile picture successfully', async () => {
      const mockResponse = { profilePictureUrl: 'https://example.com/new-avatar.jpg' };
      mockProfileApi.uploadProfilePicture.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useProfileStore());

      // Set initial profile
      act(() => {
        result.current.setProfile({
          id: '1',
          userId: 'user1',
          displayName: 'John Doe',
          profilePictureUrl: 'https://example.com/old-avatar.jpg',
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
        });
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadProfilePicture(file);
      });

      expect(result.current.profile?.profilePictureUrl).toBe('https://example.com/new-avatar.jpg');
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
