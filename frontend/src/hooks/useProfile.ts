import { useEffect, useCallback } from 'react';
import { useProfileStore } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
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

// Profile Logic Implementation - Complete implementation
export const useProfile = () => {
  const {
    profile,
    isLoading,
    error,
    isUpdating,
    completion,
    validation,
    requiredFields,
    isCompletionLoading,
    isValidationLoading,
    isRequiredFieldsLoading,
    fetchProfile,
    fetchDeveloperProfile,
    fetchClientProfile,
    updateProfile,
    updateDeveloperProfile,
    updateClientProfile,
    addSkill,
    removeSkill,
    uploadProfilePicture,
    clearProfile,
    setProfile,
    clearError,
    fetchDeveloperProfileCompletion,
    fetchClientProfileCompletion,
    validateDeveloperProfile,
    validateClientProfile,
    fetchDeveloperRequiredFields,
    fetchClientRequiredFields,
    clearCompletionData,
    clearValidationData,
    clearRequiredFieldsData,
    // Education Management
    getEducation,
    updateEducation,
    addCertification,
    removeCertification,
    downloadCertificationFile,
    // Skills Management
    getSkills,
    updateSkills,
    getSkillSuggestions,
    // Availability Management
    getAvailability,
    updateAvailability,
    getWorkPreferences,
    updateWorkPreferences,
    checkAvailability,
    // Portfolio Management
    getPortfolioLinks,
    addPortfolioLink,
    updatePortfolioLink,
    removePortfolioLink,
  } = useProfileStore();

  const { user } = useAuthStore();

  // Fetch user profile (uses unified endpoint)
  const fetchUserProfile = useCallback(async () => {
    // Get current user from store to avoid stale closure
    const currentUser = useAuthStore.getState().user;
    
    if (!currentUser) {
      return;
    }

    try {
      // All profile types now use the same endpoint
      await fetchProfile();
      
      // The profile store will handle syncing user data from the fetched profile
      // No additional sync needed here since it's handled in the store
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      handleProfileError(error);
      // Don't throw error for 404 (profile not found) - this is normal for new users
      if (error?.response?.status === 404) {
        console.log('Profile not found - this is normal for new users');
        return;
      }
      throw error;
    }
  }, [fetchProfile]);

  // Fetch profile completion based on role
  const fetchProfileCompletion = useCallback(async () => {
    if (!user) {
      // Return early without throwing error - just don't fetch
      return;
    }

    try {
      switch (user.role) {
        case 'DEVELOPER':
          await fetchDeveloperProfileCompletion();
          break;
        case 'CLIENT':
          await fetchClientProfileCompletion();
          break;
        default:
          // Unknown role - don't fetch completion
          break;
      }
    } catch (error) {
      handleProfileError(error);
      throw error;
    }
  }, [user, fetchDeveloperProfileCompletion, fetchClientProfileCompletion]);

  // Validate profile based on role
  const validateProfile = useCallback(async () => {
    if (!user) {
      // Return early without throwing error - just don't fetch
      return;
    }

    try {
      switch (user.role) {
        case 'DEVELOPER':
          await validateDeveloperProfile();
          break;
        case 'CLIENT':
          await validateClientProfile();
          break;
        default:
          // Unknown role - don't validate
          break;
      }
    } catch (error) {
      handleProfileError(error);
      throw error;
    }
  }, [user, validateDeveloperProfile, validateClientProfile]);

  // Fetch required fields based on role
  const fetchRequiredFields = useCallback(async () => {
    if (!user) {
      // Return early without throwing error - just don't fetch
      return;
    }

    try {
      switch (user.role) {
        case 'DEVELOPER':
          await fetchDeveloperRequiredFields();
          break;
        case 'CLIENT':
          await fetchClientRequiredFields();
          break;
        default:
          // Unknown role - don't fetch required fields
          break;
      }
    } catch (error) {
      handleProfileError(error);
      throw error;
    }
  }, [user, fetchDeveloperRequiredFields, fetchClientRequiredFields]);

  // Handle profile success
  const handleProfileSuccess = useCallback((response: Profile) => {
    setProfile(response);
    clearError();
  }, [setProfile, clearError]);

  // Handle profile error
  const handleProfileError = useCallback((error: any) => {
    console.error('Profile error:', error);
    
    if (error?.response?.status === 401) {
      handleUnauthorizedError(error);
    } else if (error?.response?.status === 404) {
      handleProfileNotFound(error);
    } else {
      // Error is already set in the store
    }
  }, []);

  // Handle unauthorized error
  const handleUnauthorizedError = useCallback((error: any) => {
    console.error('Unauthorized access to profile:', error);
    clearProfile();
    // Redirect to login will be handled by auth guard
  }, [clearProfile]);

  // Handle profile not found error
  const handleProfileNotFound = useCallback((error: any) => {
    console.error('Profile not found:', error);
    // Could create a default profile here if needed
  }, []);

  // Format profile data for display
  const formatProfileData = useCallback((profile: Profile | null) => {
    if (!profile) return null;

    return {
      ...profile,
      displayName: profile.displayName || `${profile.userId}`,
      skills: profile.skills || [],
      experience: profile.experience || 0,
      availability: profile.availability || { available: false },
      portfolioLinks: profile.portfolioLinks || {},
      education: profile.education || {},
      workPreferences: profile.workPreferences || {},
      location: profile.location || {},
      billingAddress: profile.billingAddress || {},
      projectPreferences: profile.projectPreferences || {},
      socialLinks: profile.socialLinks || {},
    };
  }, []);

  // Validate profile access based on role
  const validateProfileAccess = useCallback((role: string) => {
    if (!user) return false;
    
    // Users can only access their own profile type
    return user.role === role;
  }, [user]);

  // Get completion percentage
  const getCompletionPercentage = useCallback(() => {
    return completion?.completion?.overall || 0;
  }, [completion]);

  // Get validation percentage
  const getValidationPercentage = useCallback(() => {
    return validation?.validationPercentage || 0;
  }, [validation]);

  // Check if profile is complete
  const isProfileComplete = useCallback(() => {
    return getCompletionPercentage() >= 100;
  }, [getCompletionPercentage]);

  // Check if profile is valid
  const isProfileValid = useCallback(() => {
    return validation?.isValid || false;
  }, [validation]);

  // Get missing fields
  const getMissingFields = useCallback(() => {
    return completion?.completion?.missingFields || [];
  }, [completion]);

  // Get suggestions
  const getSuggestions = useCallback(() => {
    return completion?.completion?.suggestions || [];
  }, [completion]);

  // Get field validations
  const getFieldValidations = useCallback(() => {
    return validation?.fieldValidations || [];
  }, [validation]);

  // Get required fields
  const getRequiredFields = useCallback(() => {
    return requiredFields?.requiredFields || [];
  }, [requiredFields]);

  // Get completion status for a field
  const getFieldCompletionStatus = useCallback((fieldName: string) => {
    return requiredFields?.completionStatus?.[fieldName] || false;
  }, [requiredFields]);

  // Redirect to login (handled by auth guard)
  const redirectToLogin = useCallback(() => {
    // This will be handled by the auth guard component
    console.log('Redirecting to login...');
  }, []);

  // Show profile loading
  const showProfileLoading = useCallback(() => {
    // Loading state is managed by the store
  }, []);

  // Hide profile loading
  const hideProfileLoading = useCallback(() => {
    // Loading state is managed by the store
  }, []);

  // Sync user data when profile fields that affect user data are updated
  const syncUserDataFromProfile = useCallback((updatedProfile: Profile) => {
    const currentUser = useAuthStore.getState().user;
    
    if (!currentUser || !updatedProfile) return;

    // Extract user data from profile
    const displayName = updatedProfile.displayName || '';
    const nameParts = displayName.split(' ');
    const firstname = nameParts[0] || currentUser.firstname;
    const lastname = nameParts.slice(1).join(' ') || currentUser.lastname;
    
    // Only update if there are actual changes
    if (firstname !== currentUser.firstname || lastname !== currentUser.lastname) {
      const { setUser } = useAuthStore.getState();
      const updatedUser = {
        ...currentUser,
        firstname,
        lastname,
        updatedAt: new Date().toISOString()
      };
      
      setUser(updatedUser);
    }
  }, []);

  // Update profile with synchronization
  const updateProfileWithSync = useCallback(async (data: Partial<Profile>) => {
    try {
      const updatedProfile = await updateProfile(data);
      
      // Sync user data if displayName was updated
      if (data.displayName && updatedProfile) {
        syncUserDataFromProfile(updatedProfile);
      }
    } catch (error) {
      handleProfileError(error);
      throw error;
    }
  }, [updateProfile, syncUserDataFromProfile, handleProfileError]);

  // Update developer profile with synchronization
  const updateDeveloperProfileWithSync = useCallback(async (data: UpdateDeveloperProfileRequest) => {
    try {
      await updateDeveloperProfile(data);
      // Note: UpdateDeveloperProfileRequest doesn't include displayName, so no sync needed
    } catch (error) {
      handleProfileError(error);
      throw error;
    }
  }, [updateDeveloperProfile, handleProfileError]);

  // Update client profile with synchronization
  const updateClientProfileWithSync = useCallback(async (data: UpdateClientProfileRequest) => {
    try {
      await updateClientProfile(data);
      // Note: UpdateClientProfileRequest doesn't include displayName, so no sync needed
    } catch (error) {
      handleProfileError(error);
      throw error;
    }
  }, [updateClientProfile, handleProfileError]);

  // Load profile on mount
  useEffect(() => {
    if (user) {
      fetchUserProfile().catch(console.error);
      // Removed automatic calls to fetchProfileCompletion and fetchRequiredFields
      // These will be called explicitly when needed by components
    }
  }, [user, fetchUserProfile]);

  // Clear profile on unmount
  useEffect(() => {
    return () => {
      clearProfile();
      clearCompletionData();
      clearValidationData();
      clearRequiredFieldsData();
    };
  }, [clearProfile, clearCompletionData, clearValidationData, clearRequiredFieldsData]);

  return {
    // State
    profile: formatProfileData(profile),
    isLoading,
    error,
    isUpdating,
    completion,
    validation,
    requiredFields,
    isCompletionLoading,
    isValidationLoading,
    isRequiredFieldsLoading,
    
    // Actions
    fetchUserProfile,
    fetchProfileCompletion,
    validateProfile,
    fetchRequiredFields,
    updateProfile,
    updateDeveloperProfile,
    updateClientProfile,
    updateProfileWithSync,
    updateDeveloperProfileWithSync,
    updateClientProfileWithSync,
    addSkill,
    removeSkill,
    uploadProfilePicture,
    clearProfile,
    clearError,
    
    // Education Management
    getEducation,
    updateEducation,
    addCertification,
    removeCertification,
    downloadCertificationFile,
    
    // Skills Management
    getSkills,
    updateSkills,
    getSkillSuggestions,
    
    // Availability Management
    getAvailability,
    updateAvailability,
    getWorkPreferences,
    updateWorkPreferences,
    checkAvailability,
    
    // Portfolio Management
    getPortfolioLinks,
    addPortfolioLink,
    updatePortfolioLink,
    removePortfolioLink,
    
    // Utilities
    handleProfileSuccess,
    handleProfileError,
    validateProfileAccess,
    redirectToLogin,
    showProfileLoading,
    hideProfileLoading,
    
    // Completion and Validation Utilities
    getCompletionPercentage,
    getValidationPercentage,
    isProfileComplete,
    isProfileValid,
    getMissingFields,
    getSuggestions,
    getFieldValidations,
    getRequiredFields,
    getFieldCompletionStatus,
  };
};
