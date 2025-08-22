import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useProfile } from '../useProfile';
import { useProfileStore } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { createMockProfile, createMockUser } from '@/test/utils/test-utils';

// Mock the stores
vi.mock('@/store/profile');
vi.mock('@/store/auth');

const mockUseProfileStore = useProfileStore as unknown as ReturnType<typeof vi.fn>;
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

// Mock the getState method for useAuthStore
const mockGetState = vi.fn();

// Helper function to set user role and update all necessary mocks
const setUserRole = (role: 'DEVELOPER' | 'CLIENT' | null) => {
  const user = role ? createMockUser({ role }) : null;
  mockUseAuthStore.mockReturnValue({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    error: null,
  });
  mockGetState.mockReturnValue({ user });
};

describe('useProfile', () => {
  const defaultMockProfile = createMockProfile({
    role: 'DEVELOPER',
    skills: ['JavaScript', 'React', 'TypeScript'],
    experience: 5,
    hourlyRate: 75,
    education: {},
    location: {},
    projectPreferences: {},
    socialLinks: {},
    workPreferences: {},
  });

  const defaultMockUser = createMockUser({
    role: 'DEVELOPER',
  });

  const defaultMockProfileStore = {
    profile: defaultMockProfile,
    isLoading: false,
    error: null,
    isUpdating: false,
    completion: {
      completion: {
        overall: 75,
        breakdown: {
          basic: 80,
          professional: 70,
          availability: 60,
          contact: 90,
        },
        missingFields: ['skills', 'experience'],
        suggestions: ['Add your skills to showcase your expertise'],
      },
      userId: 'user123',
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    validation: {
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
      userId: 'user123',
      validatedAt: '2024-01-01T00:00:00Z',
    },
    requiredFields: {
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
      userId: 'user123',
    },
    isCompletionLoading: false,
    isValidationLoading: false,
    isRequiredFieldsLoading: false,
    fetchProfile: vi.fn(),
    fetchDeveloperProfile: vi.fn(),
    fetchClientProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateDeveloperProfile: vi.fn(),
    updateClientProfile: vi.fn(),
    addSkill: vi.fn(),
    removeSkill: vi.fn(),
    uploadProfilePicture: vi.fn(),
    clearProfile: vi.fn(),
    setProfile: vi.fn(),
    clearError: vi.fn(),
    fetchDeveloperProfileCompletion: vi.fn(),
    fetchClientProfileCompletion: vi.fn(),
    validateDeveloperProfile: vi.fn(),
    validateClientProfile: vi.fn(),
    fetchDeveloperRequiredFields: vi.fn(),
    fetchClientRequiredFields: vi.fn(),
    clearCompletionData: vi.fn(),
    clearValidationData: vi.fn(),
    clearRequiredFieldsData: vi.fn(),
    // Education Management
    getEducation: vi.fn(),
    updateEducation: vi.fn(),
    addCertification: vi.fn(),
    removeCertification: vi.fn(),
    downloadCertificationFile: vi.fn(),
    // Skills Management
    getSkills: vi.fn(),
    updateSkills: vi.fn(),
    getSkillSuggestions: vi.fn(),
    // Availability Management
    getAvailability: vi.fn(),
    updateAvailability: vi.fn(),
    getWorkPreferences: vi.fn(),
    updateWorkPreferences: vi.fn(),
    checkAvailability: vi.fn(),
    // Portfolio Management
    getPortfolioLinks: vi.fn(),
    addPortfolioLink: vi.fn(),
    updatePortfolioLink: vi.fn(),
    removePortfolioLink: vi.fn(),
  };



  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileStore.mockReturnValue(defaultMockProfileStore);
    
    // Mock the getState method
    (useAuthStore as any).getState = mockGetState;
    
    // Set default user role
    setUserRole('DEVELOPER');
  });

  describe('Profile Fetching', () => {
    it('fetches developer profile when user is a developer', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchUserProfile();
      });

      expect(defaultMockProfileStore.fetchProfile).toHaveBeenCalled();
    });

    it('fetches client profile when user is a client', async () => {
      setUserRole('CLIENT');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchUserProfile();
      });

      expect(defaultMockProfileStore.fetchProfile).toHaveBeenCalled();
    });



    it('returns early when user is not authenticated', async () => {
      setUserRole(null);
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchUserProfile();
      });

      // Should return early without calling any fetch methods
      expect(defaultMockProfileStore.fetchProfile).not.toHaveBeenCalled();
    });

    it('handles fetch errors gracefully', async () => {
      setUserRole('DEVELOPER');
      const mockError = new Error('Fetch failed');
      defaultMockProfileStore.fetchProfile.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfile());

      // Test that the method exists and can be called
      expect(typeof result.current.fetchUserProfile).toBe('function');
      
      // Test that it calls the fetch method and throws the error
      await expect(async () => {
        await act(async () => {
          await result.current.fetchUserProfile();
        });
      }).rejects.toThrow('Fetch failed');
      
      expect(defaultMockProfileStore.fetchProfile).toHaveBeenCalled();
    });
  });

  describe('Profile Completion', () => {
    it('fetches developer profile completion', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchProfileCompletion();
      });

      expect(defaultMockProfileStore.fetchDeveloperProfileCompletion).toHaveBeenCalled();
    });

    it('fetches client profile completion', async () => {
      setUserRole('CLIENT');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchProfileCompletion();
      });

      expect(defaultMockProfileStore.fetchClientProfileCompletion).toHaveBeenCalled();
    });


  });

  describe('Profile Validation', () => {
    it('validates developer profile', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.validateProfile();
      });

      expect(defaultMockProfileStore.validateDeveloperProfile).toHaveBeenCalled();
    });

    it('validates client profile', async () => {
      setUserRole('CLIENT');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.validateProfile();
      });

      expect(defaultMockProfileStore.validateClientProfile).toHaveBeenCalled();
    });


  });

  describe('Required Fields', () => {
    it('fetches developer required fields', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchRequiredFields();
      });

      expect(defaultMockProfileStore.fetchDeveloperRequiredFields).toHaveBeenCalled();
    });

    it('fetches client required fields', async () => {
      setUserRole('CLIENT');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.fetchRequiredFields();
      });

      expect(defaultMockProfileStore.fetchClientRequiredFields).toHaveBeenCalled();
    });
  });

  describe('Profile Updates', () => {
    it('updates developer profile', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        skills: ['JavaScript', 'React', 'Vue'],
        experience: 6,
        hourlyRate: 80,
      };

      await act(async () => {
        await result.current.updateDeveloperProfile(updateData);
      });

      expect(defaultMockProfileStore.updateDeveloperProfile).toHaveBeenCalledWith(updateData);
    });

    it('updates client profile', async () => {
      setUserRole('CLIENT');
      const { result } = renderHook(() => useProfile());

      const updateData = {
        companyName: 'Updated Company',
        companyWebsite: 'https://updated.com',
        contactEmail: 'updated@company.com',
      };

      await act(async () => {
        await result.current.updateClientProfile(updateData);
      });

      expect(defaultMockProfileStore.updateClientProfile).toHaveBeenCalledWith(updateData);
    });

    it('updates profile with sync', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      await act(async () => {
        await result.current.updateProfile(updateData);
      });

      expect(defaultMockProfileStore.updateProfile).toHaveBeenCalledWith(updateData);
    });

    it('handles update errors gracefully', async () => {
      setUserRole('DEVELOPER');
      const mockError = new Error('Update failed');
      defaultMockProfileStore.updateDeveloperProfile.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfile());

      await expect(result.current.updateDeveloperProfile({})).rejects.toThrow('Update failed');
    });
  });

  describe('Skill Management', () => {
    it('adds a new skill', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.addSkill('Vue.js');
      });

      expect(defaultMockProfileStore.addSkill).toHaveBeenCalledWith('Vue.js');
    });

    it('removes an existing skill', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.removeSkill('JavaScript');
      });

      expect(defaultMockProfileStore.removeSkill).toHaveBeenCalledWith('JavaScript');
    });

    it('handles skill management errors', async () => {
      setUserRole('DEVELOPER');
      const mockError = new Error('Skill operation failed');
      defaultMockProfileStore.addSkill.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfile());

      await expect(result.current.addSkill('Vue.js')).rejects.toThrow('Skill operation failed');
    });
  });

  describe('Profile Picture Upload', () => {
    it('uploads profile picture', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadProfilePicture(file);
      });

      expect(defaultMockProfileStore.uploadProfilePicture).toHaveBeenCalledWith(file);
    });

    it('handles upload errors gracefully', async () => {
      setUserRole('DEVELOPER');
      const mockError = new Error('Upload failed');
      defaultMockProfileStore.uploadProfilePicture.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfile());

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(result.current.uploadProfilePicture(file)).rejects.toThrow('Upload failed');
    });
  });

  describe('Education Management', () => {
    it('gets education data', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.getEducation();
      });

      expect(defaultMockProfileStore.getEducation).toHaveBeenCalled();
    });

    it('updates education data', async () => {
      const { result } = renderHook(() => useProfile());

      const educationData = {
        degree: 'Bachelor of Science',
        institution: 'University of Technology',
        year: 2020,
      };

      await act(async () => {
        await result.current.updateEducation(educationData);
      });

      expect(defaultMockProfileStore.updateEducation).toHaveBeenCalledWith(educationData);
    });

    it('adds certification', async () => {
      const { result } = renderHook(() => useProfile());

      const certificationData = {
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        year: 2023,
        dateObtained: '2023-06-15',
      };
      const file = new File(['test'], 'cert.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.addCertification(certificationData, file);
      });

      expect(defaultMockProfileStore.addCertification).toHaveBeenCalledWith(certificationData, file);
    });

    it('removes certification', async () => {
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.removeCertification('cert-123');
      });

      expect(defaultMockProfileStore.removeCertification).toHaveBeenCalledWith('cert-123');
    });

    it('downloads certification file', async () => {
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.downloadCertificationFile('cert-123');
      });

      expect(defaultMockProfileStore.downloadCertificationFile).toHaveBeenCalledWith('cert-123');
    });
  });

  describe('Skills Management', () => {
    it('gets skills', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.getSkills();
      });

      expect(defaultMockProfileStore.getSkills).toHaveBeenCalled();
    });

    it('updates skills', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const skills = ['JavaScript', 'React', 'TypeScript'];

      await act(async () => {
        await result.current.updateSkills(skills);
      });

      expect(defaultMockProfileStore.updateSkills).toHaveBeenCalledWith(skills);
    });

    it('gets skill suggestions', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.getSkillSuggestions();
      });

      expect(defaultMockProfileStore.getSkillSuggestions).toHaveBeenCalled();
    });
  });

  describe('Availability Management', () => {
    it('gets availability', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.getAvailability();
      });

      expect(defaultMockProfileStore.getAvailability).toHaveBeenCalled();
    });

    it('updates availability', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const availability = {
        available: true,
        hours: '9-5',
        timezone: 'UTC',
      };

      await act(async () => {
        await result.current.updateAvailability(availability);
      });

      expect(defaultMockProfileStore.updateAvailability).toHaveBeenCalledWith(availability);
    });

    it('gets work preferences', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.getWorkPreferences();
      });

      expect(defaultMockProfileStore.getWorkPreferences).toHaveBeenCalled();
    });

    it('updates work preferences', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const workPreferences = {
        remoteWork: true,
        contractType: 'full-time',
        projectDuration: '3-6 months',
      };

      await act(async () => {
        await result.current.updateWorkPreferences(workPreferences);
      });

      expect(defaultMockProfileStore.updateWorkPreferences).toHaveBeenCalledWith(workPreferences);
    });

    it('checks availability', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.checkAvailability();
      });

      expect(defaultMockProfileStore.checkAvailability).toHaveBeenCalled();
    });
  });

  describe('Portfolio Management', () => {
    it('gets portfolio links', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.getPortfolioLinks();
      });

      expect(defaultMockProfileStore.getPortfolioLinks).toHaveBeenCalled();
    });

    it('adds portfolio link', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const link = {
        label: 'GitHub',
        url: 'https://github.com/username',
      };

      await act(async () => {
        await result.current.addPortfolioLink(link);
      });

      expect(defaultMockProfileStore.addPortfolioLink).toHaveBeenCalledWith(link);
    });

    it('updates portfolio link', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      const link = {
        label: 'GitHub',
        url: 'https://github.com/newusername',
      };

      await act(async () => {
        await result.current.updatePortfolioLink('GitHub', link);
      });

      expect(defaultMockProfileStore.updatePortfolioLink).toHaveBeenCalledWith('GitHub', link);
    });

    it('removes portfolio link', async () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.removePortfolioLink('GitHub');
      });

      expect(defaultMockProfileStore.removePortfolioLink).toHaveBeenCalledWith('GitHub');
    });
  });

  describe('Data Clearing', () => {
    it('clears profile data', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.clearProfile();
      });

      expect(defaultMockProfileStore.clearProfile).toHaveBeenCalled();
    });

    it('clears error', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.clearError();
      });

      expect(defaultMockProfileStore.clearError).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('returns profile state correctly', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.profile).toEqual(defaultMockProfile);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isUpdating).toBe(false);
    });

    it('returns completion state correctly', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.completion).toBe(defaultMockProfileStore.completion);
      expect(result.current.isCompletionLoading).toBe(false);
    });

    it('returns validation state correctly', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.validation).toBe(defaultMockProfileStore.validation);
      expect(result.current.isValidationLoading).toBe(false);
    });

    it('returns required fields state correctly', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.requiredFields).toBe(defaultMockProfileStore.requiredFields);
      expect(result.current.isRequiredFieldsLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles profile errors', () => {
      setUserRole('DEVELOPER');
      const mockError = 'Profile error';
      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        error: mockError,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.error).toBe(mockError);
    });

    it('clears errors', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.clearError();
      });

      expect(defaultMockProfileStore.clearError).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('handles loading states correctly', () => {
      setUserRole('DEVELOPER');
      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        isLoading: true,
        isUpdating: true,
        isCompletionLoading: true,
        isValidationLoading: true,
        isRequiredFieldsLoading: true,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isUpdating).toBe(true);
      expect(result.current.isCompletionLoading).toBe(true);
      expect(result.current.isValidationLoading).toBe(true);
      expect(result.current.isRequiredFieldsLoading).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('returns completion percentage', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getCompletionPercentage()).toBe(75);
    });

    it('returns validation percentage', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getValidationPercentage()).toBe(75);
    });

    it('checks if profile is complete', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.isProfileComplete()).toBe(false);
    });

    it('checks if profile is valid', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.isProfileValid()).toBe(false);
    });

    it('returns missing fields', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getMissingFields()).toEqual(['skills', 'experience']);
    });

    it('returns suggestions', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getSuggestions()).toEqual(['Add your skills to showcase your expertise']);
    });

    it('returns field validations', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getFieldValidations()).toHaveLength(2);
    });

    it('returns required fields', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getRequiredFields()).toHaveLength(2);
    });

    it('returns field completion status', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.getFieldCompletionStatus('displayName')).toBe(true);
      expect(result.current.getFieldCompletionStatus('skills')).toBe(false);
    });
  });

  describe('Profile Access Validation', () => {
    it('validates developer profile access for developer user', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.validateProfileAccess('DEVELOPER')).toBe(true);
    });

    it('validates client profile access for client user', () => {
      setUserRole('CLIENT');
      const { result } = renderHook(() => useProfile());

      expect(result.current.validateProfileAccess('CLIENT')).toBe(true);
    });



    it('denies access to different profile types', () => {
      setUserRole('DEVELOPER');
      const { result } = renderHook(() => useProfile());

      expect(result.current.validateProfileAccess('CLIENT')).toBe(false);
    });

    it('denies access when user is not authenticated', () => {
      setUserRole(null);
      const { result } = renderHook(() => useProfile());

      expect(result.current.validateProfileAccess('DEVELOPER')).toBe(false);
    });
  });

  describe('Profile Data Formatting', () => {
    it('formats profile data with defaults', () => {
      setUserRole('DEVELOPER');
      const incompleteProfile = {
        id: '1',
        userId: 'user1',
        displayName: null,
        skills: null,
        experience: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        education: {},
        location: {},
        projectPreferences: {},
        socialLinks: {},
        workPreferences: {},
        availability: null,
        portfolioLinks: {},
        billingAddress: {},
      };

      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        profile: incompleteProfile,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.profile?.displayName).toBe('user1');
      expect(result.current.profile?.skills).toEqual([]);
      expect(result.current.profile?.experience).toBe(0);
      expect(result.current.profile?.availability).toEqual({ available: false });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined user role', async () => {
      const undefinedRoleUser = createMockUser({ role: undefined as any });
      mockUseAuthStore.mockReturnValue({
        user: undefinedRoleUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      mockGetState.mockReturnValue({ user: undefinedRoleUser });

      // Set up the mock to reject for this test
      defaultMockProfileStore.fetchProfile.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useProfile());

      // The fetch should still be called even with undefined role
      // but it will throw an error since the mock is set to reject
      await expect(async () => {
        await act(async () => {
          await result.current.fetchUserProfile();
        });
      }).rejects.toThrow('Fetch failed');

      expect(defaultMockProfileStore.fetchProfile).toHaveBeenCalled();
    });

    it('handles null profile data', () => {
      setUserRole('DEVELOPER');
      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        profile: null,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.profile).toBe(null);
    });

    it('handles null completion data', () => {
      setUserRole('DEVELOPER');
      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        completion: null,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.completion).toBe(null);
    });

    it('handles null validation data', () => {
      setUserRole('DEVELOPER');
      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        validation: null,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.validation).toBe(null);
    });

    it('handles null required fields data', () => {
      setUserRole('DEVELOPER');
      mockUseProfileStore.mockReturnValue({
        ...defaultMockProfileStore,
        requiredFields: null,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.requiredFields).toBe(null);
    });
  });
});
