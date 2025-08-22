import { create } from 'zustand';
import { 
  Profile, 
  UpdateDeveloperProfileRequest, 
  UpdateClientProfileRequest,
  ProfileCompletionResponse,
  ProfileValidationResponse,
  RequiredFieldsResponse,
  Education,
  Certification,
  Availability,
  WorkPreferences,
  PortfolioLinks,
  PortfolioLink
} from '@/types/api';
import { profileApi } from '@/lib/api/profile';

// Profile State - Complete implementation
interface ProfileState {
  // State
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;

  // Profile Completion and Validation State
  completion: ProfileCompletionResponse | null;
  validation: ProfileValidationResponse | null;
  requiredFields: RequiredFieldsResponse | null;
  isCompletionLoading: boolean;
  isValidationLoading: boolean;
  isRequiredFieldsLoading: boolean;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchDeveloperProfile: () => Promise<void>;
  fetchClientProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateDeveloperProfile: (data: UpdateDeveloperProfileRequest) => Promise<void>;
  updateClientProfile: (data: UpdateClientProfileRequest) => Promise<void>;
  createProfile: (data: Partial<Profile>) => Promise<void>;
  createDeveloperProfile: (data: UpdateDeveloperProfileRequest) => Promise<void>;
  createClientProfile: (data: UpdateClientProfileRequest) => Promise<void>;
  addSkill: (skill: string) => Promise<void>;
  removeSkill: (skill: string) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  clearProfile: () => void;
  setProfile: (profile: Profile) => void;
  clearError: () => void;

  // Profile Completion and Validation Actions
  fetchDeveloperProfileCompletion: () => Promise<void>;
  fetchClientProfileCompletion: () => Promise<void>;
  validateDeveloperProfile: () => Promise<void>;
  validateClientProfile: () => Promise<void>;
  fetchDeveloperRequiredFields: () => Promise<void>;
  fetchClientRequiredFields: () => Promise<void>;
  clearCompletionData: () => void;
  clearValidationData: () => void;
  clearRequiredFieldsData: () => void;

  // Education Management Actions
  getEducation: () => Promise<Education>;
  updateEducation: (educationData: Education) => Promise<void>;
  addCertification: (certificationData: Certification, file?: File) => Promise<void>;
  removeCertification: (certificationId: string) => Promise<void>;
  downloadCertificationFile: (certificationId: string) => Promise<Blob>;

  // Skills Management Actions
  getSkills: () => Promise<string[]>;
  updateSkills: (skills: string[]) => Promise<void>;
  getSkillSuggestions: () => Promise<string[]>;

  // Availability Management Actions
  getAvailability: () => Promise<Availability>;
  updateAvailability: (availability: Availability) => Promise<void>;
  getWorkPreferences: () => Promise<WorkPreferences>;
  updateWorkPreferences: (workPreferences: WorkPreferences) => Promise<void>;
  checkAvailability: () => Promise<{ available: boolean; message: string }>;

  // Portfolio Management Actions
  getPortfolioLinks: () => Promise<PortfolioLinks>;
  addPortfolioLink: (link: PortfolioLink) => Promise<void>;
  updatePortfolioLink: (label: string, link: PortfolioLink) => Promise<void>;
  removePortfolioLink: (label: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  profile: null,
  isLoading: false,
  error: null,
  isUpdating: false,

  // Profile Completion and Validation Initial State
  completion: null,
  validation: null,
  requiredFields: null,
  isCompletionLoading: false,
  isValidationLoading: false,
  isRequiredFieldsLoading: false,

  // Fetch profile based on user role
  fetchProfile: async () => {
    // Check if we already have profile data and are not currently loading
    const currentState = get();
    if (currentState.profile && !currentState.isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const profileResponse = await profileApi.getProfile();
      set({ profile: profileResponse.profile, isLoading: false });
      
      // Note: We don't auto-sync user data from profile on fetch
      // This preserves the initial signup user data for new users
      // User data will only be synced when profile is explicitly updated
    } catch (error: any) {
      // Don't set error for 404 (profile not found) - this is normal for new users
      if (error?.response?.status === 404) {
        console.log('Profile not found - this is normal for new users');
        set({ 
          profile: null, 
          isLoading: false,
          error: null 
        });
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch profile', 
          isLoading: false 
        });
      }
    }
  },

  // Fetch developer profile
  fetchDeveloperProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profileResponse = await profileApi.getDeveloperProfile();
      set({ profile: profileResponse.profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch developer profile', 
        isLoading: false 
      });
    }
  },

  // Fetch client profile
  fetchClientProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profileResponse = await profileApi.getClientProfile();
      set({ profile: profileResponse.profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch client profile', 
        isLoading: false 
      });
    }
  },

  // Update general profile
  updateProfile: async (data: Partial<Profile>) => {
    set({ isUpdating: true, error: null });
    try {
      const currentState = get();
      let updatedProfile;
      
      // If no profile exists, create one first
      if (!currentState.profile) {
        updatedProfile = await profileApi.createProfile(data);
      } else {
        updatedProfile = await profileApi.updateProfile(data);
      }
      
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile', 
        isUpdating: false 
      });
    }
  },

  // Create profile
  createProfile: async (data: Partial<Profile>) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedProfile = await profileApi.createProfile(data);
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create profile', 
        isUpdating: false 
      });
    }
  },

  // Create developer profile
  createDeveloperProfile: async (data: UpdateDeveloperProfileRequest) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedProfile = await profileApi.createDeveloperProfile(data);
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create developer profile', 
        isUpdating: false 
      });
    }
  },

  // Create client profile
  createClientProfile: async (data: UpdateClientProfileRequest) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedProfile = await profileApi.createClientProfile(data);
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create client profile', 
        isUpdating: false 
      });
    }
  },

  // Update developer profile
  updateDeveloperProfile: async (data: UpdateDeveloperProfileRequest) => {
    set({ isUpdating: true, error: null });
    try {
      const currentState = get();
      let updatedProfile;
      
      // If no profile exists, create one first
      if (!currentState.profile) {
        updatedProfile = await profileApi.createDeveloperProfile(data);
      } else {
        updatedProfile = await profileApi.updateDeveloperProfile(data);
      }
      
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update developer profile', 
        isUpdating: false 
      });
    }
  },

  // Update client profile
  updateClientProfile: async (data: UpdateClientProfileRequest) => {
    set({ isUpdating: true, error: null });
    try {
      const currentState = get();
      let updatedProfile;
      
      // If no profile exists, create one first
      if (!currentState.profile) {
        updatedProfile = await profileApi.createClientProfile(data);
      } else {
        updatedProfile = await profileApi.updateClientProfile(data);
      }
      
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update client profile', 
        isUpdating: false 
      });
    }
  },

  // Add skill to developer profile
  addSkill: async (skill: string) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedProfile = await profileApi.addSkill(skill);
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add skill', 
        isUpdating: false 
      });
    }
  },

  // Remove skill from developer profile
  removeSkill: async (skill: string) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedProfile = await profileApi.removeSkill(skill);
      set({ profile: updatedProfile, isUpdating: false });
      
      // Sync user data with profile data for matching fields
      const { useAuthStore } = await import('./auth');
      const { setUser } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser && updatedProfile) {
        // Extract user data from profile response
        const displayName = updatedProfile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstname = nameParts[0] || currentUser.firstname;
        const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
        
        const updatedUser = {
          ...currentUser,
          firstname: firstname,
          lastname: lastname,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove skill', 
        isUpdating: false 
      });
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File) => {
    set({ isUpdating: true, error: null });
    try {
      const { profilePictureUrl } = await profileApi.uploadProfilePicture(file);
      const currentProfile = get().profile;
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, profilePictureUrl };
        set({ 
          profile: updatedProfile, 
          isUpdating: false 
        });
        
        // Sync user data with profile data for matching fields
        const { useAuthStore } = await import('./auth');
        const { setUser } = useAuthStore.getState();
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser && updatedProfile) {
          // Extract user data from profile response
          const displayName = updatedProfile.displayName || '';
          const nameParts = displayName.split(' ');
          const firstname = nameParts[0] || currentUser.firstname;
          const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
          
          const updatedUser = {
            ...currentUser,
            firstname: firstname,
            lastname: lastname,
            updatedAt: new Date().toISOString()
          };
          
          setUser(updatedUser);
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to upload profile picture', 
        isUpdating: false 
      });
    }
  },

  // Profile Completion and Validation Actions
  fetchDeveloperProfileCompletion: async () => {
    set({ isCompletionLoading: true, error: null });
    try {
      const completion = await profileApi.getDeveloperProfileCompletion();
      set({ completion, isCompletionLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch profile completion', 
        isCompletionLoading: false 
      });
    }
  },

  fetchClientProfileCompletion: async () => {
    set({ isCompletionLoading: true, error: null });
    try {
      const completion = await profileApi.getClientProfileCompletion();
      set({ completion, isCompletionLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch profile completion', 
        isCompletionLoading: false 
      });
    }
  },

  validateDeveloperProfile: async () => {
    set({ isValidationLoading: true, error: null });
    try {
      const validation = await profileApi.validateDeveloperProfile();
      set({ validation, isValidationLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to validate profile', 
        isValidationLoading: false 
      });
    }
  },

  validateClientProfile: async () => {
    set({ isValidationLoading: true, error: null });
    try {
      const validation = await profileApi.validateClientProfile();
      set({ validation, isValidationLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to validate profile', 
        isValidationLoading: false 
      });
    }
  },

  fetchDeveloperRequiredFields: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const requiredFields = await profileApi.getDeveloperRequiredFields();
      set({ requiredFields, isRequiredFieldsLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch required fields', 
        isRequiredFieldsLoading: false 
      });
    }
  },

  fetchClientRequiredFields: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const requiredFields = await profileApi.getClientRequiredFields();
      set({ requiredFields, isRequiredFieldsLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch required fields', 
        isRequiredFieldsLoading: false 
      });
    }
  },

  // Clear profile data
  clearProfile: () => {
    set({ profile: null, error: null });
  },

  // Set profile data
  setProfile: (profile: Profile) => {
    set({ profile });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear completion data
  clearCompletionData: () => {
    set({ completion: null });
  },

  // Clear validation data
  clearValidationData: () => {
    set({ validation: null });
  },

  // Clear required fields data
  clearRequiredFieldsData: () => {
    set({ requiredFields: null });
  },

  // Education Management Actions
  getEducation: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const education = await profileApi.getEducation();
      set({ isRequiredFieldsLoading: false });
      return education;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get education', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  updateEducation: async (educationData: Education) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.updateEducation(educationData);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update education', 
        isUpdating: false 
      });
    }
  },

  addCertification: async (certificationData: Certification, file?: File) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.addCertification(certificationData, file);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add certification', 
        isUpdating: false 
      });
    }
  },

  removeCertification: async (certificationId: string) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.removeCertification(certificationId);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove certification', 
        isUpdating: false 
      });
    }
  },

  downloadCertificationFile: async (certificationId: string) => {
    set({ isUpdating: true, error: null });
    try {
      const fileBlob = await profileApi.downloadCertificationFile(certificationId);
      set({ isUpdating: false });
      return fileBlob;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to download certification file', 
        isUpdating: false 
      });
      throw error;
    }
  },

  // Skills Management Actions
  getSkills: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const skills = await profileApi.getSkills();
      set({ isRequiredFieldsLoading: false });
      return skills;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get skills', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  updateSkills: async (skills: string[]) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.updateSkills(skills);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update skills', 
        isUpdating: false 
      });
    }
  },

  getSkillSuggestions: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const suggestions = await profileApi.getSkillSuggestions();
      set({ isRequiredFieldsLoading: false });
      return suggestions;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get skill suggestions', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  // Availability Management Actions
  getAvailability: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const availability = await profileApi.getAvailability();
      set({ isRequiredFieldsLoading: false });
      return availability;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get availability', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  updateAvailability: async (availability: Availability) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.updateAvailability(availability);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update availability', 
        isUpdating: false 
      });
    }
  },

  getWorkPreferences: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const workPreferences = await profileApi.getWorkPreferences();
      set({ isRequiredFieldsLoading: false });
      return workPreferences;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get work preferences', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  updateWorkPreferences: async (workPreferences: WorkPreferences) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.updateWorkPreferences(workPreferences);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update work preferences', 
        isUpdating: false 
      });
    }
  },

  checkAvailability: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const availability = await profileApi.checkAvailability();
      set({ isRequiredFieldsLoading: false });
      return availability;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to check availability', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  // Portfolio Management Actions
  getPortfolioLinks: async () => {
    set({ isRequiredFieldsLoading: true, error: null });
    try {
      const portfolioLinks = await profileApi.getPortfolioLinks();
      set({ isRequiredFieldsLoading: false });
      return portfolioLinks;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get portfolio links', 
        isRequiredFieldsLoading: false 
      });
      throw error;
    }
  },

  addPortfolioLink: async (link: PortfolioLink) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.addPortfolioLink(link);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add portfolio link', 
        isUpdating: false 
      });
    }
  },

  updatePortfolioLink: async (label: string, link: PortfolioLink) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.updatePortfolioLink(label, link);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update portfolio link', 
        isUpdating: false 
      });
    }
  },

  removePortfolioLink: async (label: string) => {
    set({ isUpdating: true, error: null });
    try {
      await profileApi.removePortfolioLink(label);
      set({ isUpdating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove portfolio link', 
        isUpdating: false 
      });
    }
  },
}));
