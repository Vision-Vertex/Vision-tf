// Validation Utilities - Complete implementation for profile management
// Provides client-side validation matching backend rules, real-time validation feedback,
// and form submission validation

import { UpdateDeveloperProfileRequest, UpdateClientProfileRequest, Profile } from '@/types/api';

// Validation Rules Interface
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
  message?: string;
}

// Validation Result Interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Field Validation Result
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  value: any;
}

// Form Validation State
export interface FormValidationState {
  [field: string]: FieldValidationResult;
}

// Profile Validation Rules
export const PROFILE_VALIDATION_RULES = {
  // Developer Profile Rules
  developer: {
    displayName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\s\-_]+$/,
      message: 'Display name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'
    },
    bio: {
      maxLength: 500,
      message: 'Bio must be less than 500 characters'
    },
    experience: {
      min: 0,
      max: 50,
      message: 'Experience must be between 0 and 50 years'
    },
    hourlyRate: {
      min: 0,
      max: 1000,
      message: 'Hourly rate must be between $0 and $1000'
    },
    currency: {
      required: true,
      pattern: /^[A-Z]{3}$/,
      message: 'Currency must be a 3-letter code (e.g., USD, EUR)'
    },
    skills: {
      custom: (skills: string[]) => {
        if (!Array.isArray(skills)) return 'Skills must be an array';
        if (skills.length > 20) return 'Maximum 20 skills allowed';
        if (skills.some(skill => skill.length > 50)) return 'Each skill must be less than 50 characters';
        if (skills.some(skill => !/^[a-zA-Z0-9\s\-_#+]+$/.test(skill))) {
          return 'Skills can only contain letters, numbers, spaces, hyphens, underscores, #, and +';
        }
        return true;
      }
    },
    availability: {
      custom: (availability: any) => {
        if (!availability) return true;
        if (availability.maxHoursPerWeek && (availability.maxHoursPerWeek < 1 || availability.maxHoursPerWeek > 168)) {
          return 'Maximum hours per week must be between 1 and 168';
        }
        return true;
      }
    },
    portfolioLinks: {
      custom: (links: any) => {
        if (!links) return true;
        const urlPattern = /^https?:\/\/.+/;
        const validFields = ['github', 'linkedin', 'website', 'x'];
        
        for (const field of validFields) {
          if (links[field] && !urlPattern.test(links[field])) {
            return `${field} URL must be a valid HTTP/HTTPS URL`;
          }
        }
        
        if (links.customLinks && Array.isArray(links.customLinks)) {
          for (const link of links.customLinks) {
            if (!link.label || !link.url) {
              return 'Custom portfolio links must have both label and URL';
            }
            if (!urlPattern.test(link.url)) {
              return 'Custom portfolio link URL must be a valid HTTP/HTTPS URL';
            }
          }
        }
        
        return true;
      }
    }
  },
  
  // Client Profile Rules
  client: {
    companyName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_&.,()]+$/,
      message: 'Company name must be 2-100 characters and contain only letters, numbers, spaces, and common punctuation'
    },
    companyWebsite: {
      pattern: /^https?:\/\/.+/,
      message: 'Company website must be a valid HTTP/HTTPS URL'
    },
    companySize: {
      pattern: /^(1-10|11-50|51-200|201-500|501-1000|1000\+)$/,
      message: 'Company size must be one of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+'
    },
    industry: {
      maxLength: 100,
      message: 'Industry must be less than 100 characters'
    },
    companyDescription: {
      maxLength: 1000,
      message: 'Company description must be less than 1000 characters'
    },
    contactPerson: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-']+$/,
      message: 'Contact person name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes'
    },
    contactEmail: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Contact email must be a valid email address'
    },
    contactPhone: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Contact phone must be a valid phone number'
    },
    location: {
      custom: (location: any) => {
        if (!location) return true;
        if (location.country && location.country.length > 100) {
          return 'Country must be less than 100 characters';
        }
        if (location.city && location.city.length > 100) {
          return 'City must be less than 100 characters';
        }
        if (location.state && location.state.length > 100) {
          return 'State must be less than 100 characters';
        }
        return true;
      }
    },
    billingAddress: {
      custom: (address: any) => {
        if (!address) return true;
        if (address.street && address.street.length > 200) {
          return 'Street address must be less than 200 characters';
        }
        if (address.postalCode && address.postalCode.length > 20) {
          return 'Postal code must be less than 20 characters';
        }
        return true;
      }
    }
  }
};

/**
 * Validate a single field against its rules
 */
export function validateField(
  fieldName: string,
  value: any,
  rules: ValidationRule
): FieldValidationResult {
  const result: FieldValidationResult = {
    isValid: true,
    value
  };

  // Check if field is required
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    result.isValid = false;
    result.error = rules.message || `${fieldName} is required`;
    return result;
  }

  // Skip further validation if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return result;
  }

  // Validate string length
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      result.isValid = false;
      result.error = rules.message || `${fieldName} must be at least ${rules.minLength} characters`;
      return result;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      result.isValid = false;
      result.error = rules.message || `${fieldName} must be less than ${rules.maxLength} characters`;
      return result;
    }

    // Validate pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      result.isValid = false;
      result.error = rules.message || `${fieldName} format is invalid`;
      return result;
    }
  }

  // Validate number range
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      result.isValid = false;
      result.error = rules.message || `${fieldName} must be at least ${rules.min}`;
      return result;
    }

    if (rules.max !== undefined && value > rules.max) {
      result.isValid = false;
      result.error = rules.message || `${fieldName} must be less than ${rules.max}`;
      return result;
    }
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(value);
    if (customResult !== true) {
      result.isValid = false;
      result.error = typeof customResult === 'string' ? customResult : `${fieldName} is invalid`;
      return result;
    }
  }

  return result;
}

/**
 * Validate a complete developer profile
 */
export function validateDeveloperProfile(data: UpdateDeveloperProfileRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  const rules = PROFILE_VALIDATION_RULES.developer;

  // Validate each field
  Object.entries(data).forEach(([fieldName, value]) => {
    if (rules[fieldName as keyof typeof rules]) {
      const fieldResult = validateField(fieldName, value, rules[fieldName as keyof typeof rules]);
      if (!fieldResult.isValid && fieldResult.error) {
        errors.push(fieldResult.error);
        isValid = false;
      }
    }
  });

  // Additional cross-field validations
  if (data.hourlyRate && data.hourlyRate > 0 && !data.currency) {
    errors.push('Currency is required when setting an hourly rate');
    isValid = false;
  }

  if (data.availability?.maxHoursPerWeek && data.availability.maxHoursPerWeek > 40) {
    warnings.push('Working more than 40 hours per week may affect work-life balance');
  }

  return { isValid, errors, warnings };
}

/**
 * Validate a complete client profile
 */
export function validateClientProfile(data: UpdateClientProfileRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  const rules = PROFILE_VALIDATION_RULES.client;

  // Validate each field
  Object.entries(data).forEach(([fieldName, value]) => {
    if (rules[fieldName as keyof typeof rules]) {
      const fieldResult = validateField(fieldName, value, rules[fieldName as keyof typeof rules]);
      if (!fieldResult.isValid && fieldResult.error) {
        errors.push(fieldResult.error);
        isValid = false;
      }
    }
  });

  // Additional cross-field validations
  if (data.companyWebsite && !data.companyName) {
    warnings.push('Consider adding a company name when providing a website');
  }

  if (data.contactEmail && data.contactEmail !== data.contactPerson) {
    warnings.push('Contact email should match the contact person for consistency');
  }

  return { isValid, errors, warnings };
}

/**
 * Real-time validation for form fields
 */
export function validateFieldRealTime(
  fieldName: string,
  value: any,
  profileType: 'developer' | 'client'
): FieldValidationResult {
  const rules = PROFILE_VALIDATION_RULES[profileType];
  
  if (rules[fieldName as keyof typeof rules]) {
    return validateField(fieldName, value, rules[fieldName as keyof typeof rules]);
  }

  return { isValid: true, value };
}

/**
 * Get validation state for all fields in a form
 */
export function getFormValidationState(
  formData: UpdateDeveloperProfileRequest | UpdateClientProfileRequest,
  profileType: 'developer' | 'client'
): FormValidationState {
  const validationState: FormValidationState = {};
  const rules = PROFILE_VALIDATION_RULES[profileType];

  Object.entries(formData).forEach(([fieldName, value]) => {
    if (rules[fieldName as keyof typeof rules]) {
      validationState[fieldName] = validateField(fieldName, value, rules[fieldName as keyof typeof rules]);
    }
  });

  return validationState;
}

/**
 * Check if form is valid based on validation state
 */
export function isFormValid(validationState: FormValidationState): boolean {
  return Object.values(validationState).every(field => field.isValid);
}

/**
 * Get all errors from validation state
 */
export function getFormErrors(validationState: FormValidationState): string[] {
  return Object.values(validationState)
    .filter(field => !field.isValid && field.error)
    .map(field => field.error!)
    .filter(Boolean);
}

/**
 * Get all warnings from validation state
 */
export function getFormWarnings(validationState: FormValidationState): string[] {
  return Object.values(validationState)
    .filter(field => field.warning)
    .map(field => field.warning!)
    .filter(Boolean);
}

/**
 * Validate profile picture upload
 */
export function validateProfilePicture(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Profile picture must be a JPEG, PNG, or WebP image');
    isValid = false;
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('Profile picture must be less than 5MB');
    isValid = false;
  }

  // Check minimum size (at least 100x100 pixels)
  if (file.size < 1024) { // Very small files are likely too small
    warnings.push('Profile picture should be at least 100x100 pixels for best quality');
  }

  return { isValid, errors, warnings };
}

/**
 * Sanitize form data before submission
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      // Trim whitespace
      sanitized[key] = value.trim();
      
      // Remove excessive whitespace
      sanitized[key] = value.replace(/\s+/g, ' ');
    }
    
    if (Array.isArray(value)) {
      // Filter out empty strings and trim array items
      sanitized[key] = value
        .filter(item => item !== null && item !== undefined && item !== '')
        .map(item => typeof item === 'string' ? item.trim() : item);
    }
  });

  return sanitized;
}

/**
 * Format validation error for display
 */
export function formatValidationError(fieldName: string, error: string): string {
  const fieldDisplayName = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  
  return error.replace(fieldName, fieldDisplayName);
}

/**
 * Debounce function for real-time validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for validation calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
