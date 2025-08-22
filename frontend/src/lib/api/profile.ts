import { apiClient, handleApiResponse } from './client';
import { handleApiError } from '@/lib/utils/api';
import { 
  Profile, 
  ProfileResponse,
  UpdateDeveloperProfileRequest, 
  UpdateClientProfileRequest,
  PortfolioLinks,
  PortfolioLink,
  ProfileCompletionResponse,
  ProfileValidationResponse,
  RequiredFieldsResponse,
  ApiResponse,
  Education,
  Certification,
  Availability,
  WorkPreferences
} from '@/types/api';

// Profile API Service - Complete implementation with enhanced error handling and type safety
export const profileApi = {
  // Get user profile
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProfileResponse>>('/profile');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get developer profile (uses same endpoint as getProfile)
  async getDeveloperProfile(): Promise<ProfileResponse> {
    return this.getProfile();
  },

  // Get client profile (uses same endpoint as getProfile)
  async getClientProfile(): Promise<ProfileResponse> {
    return this.getProfile();
  },

  // Update developer profile
  async updateDeveloperProfile(data: UpdateDeveloperProfileRequest): Promise<Profile> {
    try {
      const response = await apiClient.patch<ApiResponse<Profile>>('/profile/developer', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update client profile
  async updateClientProfile(data: UpdateClientProfileRequest): Promise<Profile> {
    try {
      const response = await apiClient.patch<ApiResponse<Profile>>('/profile/client', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update general profile
  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    try {
      const response = await apiClient.patch<ApiResponse<Profile>>('/profile', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create profile (creates basic profile first, then updates it)
  async createProfile(data: Partial<Profile>): Promise<Profile> {
    try {
      // First try to create a basic profile with minimal data
      const basicProfileData = {
        displayName: data.displayName || '',
        bio: data.bio || '',
        profilePictureUrl: data.profilePictureUrl || null,
      };
      
      const response = await apiClient.post<ApiResponse<Profile>>('/profile', basicProfileData);
      const createdProfile = handleApiResponse(response);
      
      // If we have additional data, update the profile
      if (Object.keys(data).length > Object.keys(basicProfileData).length) {
        return this.updateProfile(data);
      }
      
      return createdProfile;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create developer profile
  async createDeveloperProfile(data: UpdateDeveloperProfileRequest): Promise<Profile> {
    try {
      // First try to create a basic profile
      const basicProfileData = {
        displayName: data.bio ? data.bio.split(' ').slice(0, 2).join(' ') : '',
        bio: data.bio || '',
        skills: data.skills || [],
        experience: data.experience || 0,
        hourlyRate: data.hourlyRate || 0,
        currency: data.currency || 'USD',
        availability: data.availability || { available: false },
        portfolioLinks: data.portfolioLinks || {},
        education: data.education || {},
        workPreferences: data.workPreferences || {},
      };
      
      const response = await apiClient.post<ApiResponse<Profile>>('/profile/developer', basicProfileData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create client profile
  async createClientProfile(data: UpdateClientProfileRequest): Promise<Profile> {
    try {
      // First try to create a basic profile
      const basicProfileData = {
        displayName: data.contactPerson || data.bio ? data.bio.split(' ').slice(0, 2).join(' ') : '',
        bio: data.bio || '',
        companyName: data.companyName || '',
        companyWebsite: data.companyWebsite || '',
        companySize: data.companySize || '',
        industry: data.industry || '',
        companyDescription: data.companyDescription || '',
        contactPerson: data.contactPerson || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        location: data.location || {},
        billingAddress: data.billingAddress || {},
        projectPreferences: data.projectPreferences || {},
        socialLinks: data.socialLinks || {},
      };
      
      const response = await apiClient.post<ApiResponse<Profile>>('/profile/client', basicProfileData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Profile Completion and Validation - Developer
  async getDeveloperProfileCompletion(): Promise<ProfileCompletionResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProfileCompletionResponse>>('/profile/developer/completion');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async validateDeveloperProfile(): Promise<ProfileValidationResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProfileValidationResponse>>('/profile/developer/validation');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getDeveloperRequiredFields(): Promise<RequiredFieldsResponse> {
    try {
      const response = await apiClient.get<ApiResponse<RequiredFieldsResponse>>('/profile/developer/required-fields');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Profile Completion and Validation - Client
  async getClientProfileCompletion(): Promise<ProfileCompletionResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProfileCompletionResponse>>('/profile/client/completion');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async validateClientProfile(): Promise<ProfileValidationResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProfileValidationResponse>>('/profile/client/validation');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getClientRequiredFields(): Promise<RequiredFieldsResponse> {
    try {
      const response = await apiClient.get<ApiResponse<RequiredFieldsResponse>>('/profile/client/required-fields');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Education Management - Uses dedicated education endpoints
  async getEducation(): Promise<Education> {
    try {
      const response = await apiClient.get<ApiResponse<Education>>('/profile/education');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateEducation(educationData: Education): Promise<Education> {
    try {
      const response = await apiClient.put<ApiResponse<Education>>('/profile/education', educationData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async addCertification(certificationData: Certification, file?: File): Promise<Education> {
    try {
      const formData = new FormData();
      
      // Add certification data
      Object.entries(certificationData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add file if provided
      if (file) {
        formData.append('file', file);
      }
      
      const response = await apiClient.post<ApiResponse<Education>>('/profile/education/certifications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async removeCertification(certificationId: string): Promise<Education> {
    try {
      const response = await apiClient.delete<ApiResponse<Education>>(`/profile/education/certifications/${certificationId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async downloadCertificationFile(certificationId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/profile/education/certifications/${certificationId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Skills Management - Uses dedicated skills endpoints
  async getSkills(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>('/profile/developer/skills');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async addSkill(skill: string): Promise<Profile> {
    try {
      const response = await apiClient.post<ApiResponse<Profile>>('/profile/developer/skills/add', { skill });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async removeSkill(skill: string): Promise<Profile> {
    try {
      const response = await apiClient.delete<ApiResponse<Profile>>(`/profile/developer/skills/${encodeURIComponent(skill)}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateSkills(skills: string[]): Promise<Profile> {
    try {
      const response = await apiClient.put<ApiResponse<Profile>>('/profile/developer/skills', { skills });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getSkillSuggestions(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>('/profile/developer/skills/suggestions');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Availability Management - Uses dedicated availability endpoints
  async getAvailability(): Promise<Availability> {
    try {
      const response = await apiClient.get<ApiResponse<Availability>>('/profile/developer/availability/availability');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateAvailability(availability: Availability): Promise<Availability> {
    try {
      const response = await apiClient.patch<ApiResponse<Availability>>('/profile/developer/availability/availability', availability);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getWorkPreferences(): Promise<WorkPreferences> {
    try {
      const response = await apiClient.get<ApiResponse<WorkPreferences>>('/profile/developer/availability/work-preferences');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateWorkPreferences(workPreferences: WorkPreferences): Promise<WorkPreferences> {
    try {
      const response = await apiClient.patch<ApiResponse<WorkPreferences>>('/profile/developer/availability/work-preferences', workPreferences);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async checkAvailability(): Promise<{ available: boolean; message: string }> {
    try {
      const response = await apiClient.get<ApiResponse<{ available: boolean; message: string }>>('/profile/developer/availability/check');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Portfolio Management - Uses dedicated portfolio endpoints
  async getPortfolioLinks(): Promise<PortfolioLinks> {
    try {
      const response = await apiClient.get<ApiResponse<PortfolioLinks>>('/profile/portfolio');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async addPortfolioLink(link: PortfolioLink): Promise<PortfolioLinks> {
    try {
      const response = await apiClient.post<ApiResponse<PortfolioLinks>>('/profile/portfolio/custom', link);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updatePortfolioLink(label: string, link: PortfolioLink): Promise<PortfolioLinks> {
    try {
      const response = await apiClient.patch<ApiResponse<PortfolioLinks>>(`/profile/portfolio/custom/${label}`, link);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async removePortfolioLink(label: string): Promise<PortfolioLinks> {
    try {
      const response = await apiClient.delete<ApiResponse<PortfolioLinks>>(`/profile/portfolio/custom/${label}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<{ profilePictureUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiClient.post<ApiResponse<{ profilePictureUrl: string }>>('/profile/picture/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Search profiles
  async searchProfiles(query: string, filters?: Record<string, any>): Promise<Profile[]> {
    try {
      const params = new URLSearchParams({ query, ...filters });
      const response = await apiClient.get<ApiResponse<Profile[]>>(`/profile/search?${params}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get profile by ID (for admin or public viewing)
  async getProfileById(profileId: string): Promise<Profile> {
    try {
      const response = await apiClient.get<ApiResponse<Profile>>(`/profile/${profileId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete profile (admin only)
  async deleteProfile(profileId: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/profile/${profileId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};
