// Form Validation Hook - Complete implementation for real-time validation
// Provides validation state management, real-time feedback, and form submission validation

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  validateFieldRealTime,
  getFormValidationState,
  isFormValid,
  getFormErrors,
  getFormWarnings,
  sanitizeFormData,
  debounce,
  ValidationResult,
  FormValidationState,
  FieldValidationResult
} from '@/lib/utils/validation';
import { UpdateDeveloperProfileRequest, UpdateClientProfileRequest } from '@/types/api';

interface UseFormValidationOptions {
  profileType: 'developer' | 'client';
  debounceMs?: number;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormValidationReturn<T> {
  // Validation state
  validationState: FormValidationState;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hasErrors: boolean;
  hasWarnings: boolean;
  
  // Validation actions
  validateField: (fieldName: string, value: any) => FieldValidationResult;
  validateForm: (formData: T) => ValidationResult;
  validateAllFields: (formData: T) => void;
  clearValidation: (fieldName?: string) => void;
  clearAllValidation: () => void;
  
  // Field-specific helpers
  getFieldError: (fieldName: string) => string | undefined;
  getFieldWarning: (fieldName: string) => string | undefined;
  isFieldValid: (fieldName: string) => boolean;
  isFieldTouched: (fieldName: string) => boolean;
  
  // Form submission helpers
  canSubmit: (formData: T) => boolean;
  getSubmissionErrors: (formData: T) => string[];
  sanitizeAndValidate: (formData: T) => { data: T; isValid: boolean; errors: string[] };
  
  // Field event handlers
  handleFieldBlur: (fieldName: string, value: any) => void;
  handleFieldChange: (fieldName: string, value: any) => void;
  
  // Field props creator
  createFieldProps: (fieldName: string) => {
    onBlur: (value: any) => void;
    onChange: (value: any) => void;
    error: string | undefined;
    warning: string | undefined;
    isValid: boolean;
    isTouched: boolean;
    hasError: boolean;
    hasWarning: boolean;
  };
}

export function useFormValidation<T extends UpdateDeveloperProfileRequest | UpdateClientProfileRequest>(
  options: UseFormValidationOptions
): UseFormValidationReturn<T> {
  const {
    profileType,
    debounceMs = 300,
    validateOnMount = false,
    validateOnChange = true,
    validateOnBlur = true
  } = options;

  // Validation state - ensure it's always an object
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Memoized validation results
  const isValid = useMemo(() => {
    // If no validation state, consider form valid by default
    if (!validationState || Object.keys(validationState).length === 0) {
      return true;
    }
    return isFormValid(validationState);
  }, [validationState]);
  
  const errors = useMemo(() => getFormErrors(validationState || {}) || [], [validationState]);
  const warnings = useMemo(() => getFormWarnings(validationState || {}) || [], [validationState]);
  const hasErrors = useMemo(() => (errors || []).length > 0, [errors]);
  const hasWarnings = useMemo(() => (warnings || []).length > 0, [warnings]);

  // Debounced validation function
  const debouncedValidateField = useMemo(
    () => debounce((fieldName: string, value: any) => {
      const result = validateFieldRealTime(fieldName, value, profileType);
      setValidationState(prev => ({
        ...prev,
        [fieldName]: result
      }));
    }, debounceMs),
    [profileType, debounceMs]
  );

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): FieldValidationResult => {
    const result = validateFieldRealTime(fieldName, value, profileType);
    
    if (validateOnChange) {
      debouncedValidateField(fieldName, value);
    }
    
    return result;
  }, [profileType, validateOnChange, debouncedValidateField]);

  // Validate entire form
  const validateForm = useCallback((formData: T): ValidationResult => {
    if (!formData) {
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    }
    
    const newValidationState = getFormValidationState(formData, profileType);
    setValidationState(newValidationState);
    
    return {
      isValid: isFormValid(newValidationState),
      errors: getFormErrors(newValidationState) || [],
      warnings: getFormWarnings(newValidationState) || []
    };
  }, [profileType]);

  // Validate all fields and update state
  const validateAllFields = useCallback((formData: T) => {
    if (!formData) {
      setValidationState({});
      return;
    }
    
    const newValidationState = getFormValidationState(formData, profileType);
    setValidationState(newValidationState);
  }, [profileType]);

  // Clear validation for a specific field or all fields
  const clearValidation = useCallback((fieldName?: string) => {
    if (fieldName) {
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
      setTouchedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    } else {
      setValidationState({});
      setTouchedFields(new Set());
    }
  }, []);

  // Clear all validation
  const clearAllValidation = useCallback(() => {
    setValidationState({});
    setTouchedFields(new Set());
  }, []);

  // Get field error
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return validationState?.[fieldName]?.error;
  }, [validationState]);

  // Get field warning
  const getFieldWarning = useCallback((fieldName: string): string | undefined => {
    return validationState?.[fieldName]?.warning;
  }, [validationState]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string): boolean => {
    return validationState?.[fieldName]?.isValid ?? true;
  }, [validationState]);

  // Check if field has been touched
  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return touchedFields.has(fieldName);
  }, [touchedFields]);

  // Mark field as touched
  const markFieldTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  }, []);

  // Check if form can be submitted
  const canSubmit = useCallback((formData: T): boolean => {
    if (!formData) return false;
    
    const validation = validateForm(formData);
    return validation.isValid && !hasErrors;
  }, [validateForm, hasErrors]);

  // Get submission errors
  const getSubmissionErrors = useCallback((formData: T): string[] => {
    if (!formData) return [];
    
    const validation = validateForm(formData);
    return validation.errors || [];
  }, [validateForm]);

  // Sanitize and validate form data
  const sanitizeAndValidate = useCallback((formData: T) => {
    if (!formData) {
      return {
        data: {} as T,
        isValid: true,
        errors: []
      };
    }
    
    const sanitizedData = sanitizeFormData(formData);
    const validation = validateForm(sanitizedData);
    
    return {
      data: sanitizedData,
      isValid: validation.isValid,
      errors: validation.errors || []
    };
  }, [validateForm]);

  // Handle field blur for validation
  const handleFieldBlur = useCallback((fieldName: string, value: any) => {
    if (validateOnBlur) {
      markFieldTouched(fieldName);
      const result = validateFieldRealTime(fieldName, value, profileType);
      setValidationState(prev => ({
        ...prev,
        [fieldName]: result
      }));
    }
  }, [validateOnBlur, profileType, markFieldTouched]);

  // Handle field change for validation
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (validateOnChange) {
      markFieldTouched(fieldName);
      debouncedValidateField(fieldName, value);
    }
  }, [validateOnChange, markFieldTouched, debouncedValidateField]);

  // Create field validation props for easy use in forms
  const createFieldProps = useCallback((fieldName: string) => ({
    onBlur: (value: any) => handleFieldBlur(fieldName, value),
    onChange: (value: any) => handleFieldChange(fieldName, value),
    error: getFieldError(fieldName),
    warning: getFieldWarning(fieldName),
    isValid: isFieldValid(fieldName),
    isTouched: isFieldTouched(fieldName),
    hasError: !!getFieldError(fieldName),
    hasWarning: !!getFieldWarning(fieldName)
  }), [handleFieldBlur, handleFieldChange, getFieldError, getFieldWarning, isFieldValid, isFieldTouched]);

  // Effect for initial validation if needed
  useEffect(() => {
    if (validateOnMount) {
      // This would be called with initial form data
      // Implementation depends on how the hook is used
    }
  }, [validateOnMount]);

  return {
    // Validation state
    validationState: validationState || {},
    isValid,
    errors,
    warnings,
    hasErrors,
    hasWarnings,
    
    // Validation actions
    validateField,
    validateForm,
    validateAllFields,
    clearValidation,
    clearAllValidation,
    
    // Field-specific helpers
    getFieldError,
    getFieldWarning,
    isFieldValid,
    isFieldTouched,
    
    // Form submission helpers
    canSubmit,
    getSubmissionErrors,
    sanitizeAndValidate,
    
    // Field event handlers
    handleFieldBlur,
    handleFieldChange,
    
    // Field props creator
    createFieldProps
  };
}

// Specialized hooks for different profile types
export function useDeveloperProfileValidation(options?: Omit<UseFormValidationOptions, 'profileType'>) {
  return useFormValidation<UpdateDeveloperProfileRequest>({
    profileType: 'developer',
    ...options
  });
}

export function useClientProfileValidation(options?: Omit<UseFormValidationOptions, 'profileType'>) {
  return useFormValidation<UpdateClientProfileRequest>({
    profileType: 'client',
    ...options
  });
}

// Hook for profile picture validation
export function useProfilePictureValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const validateFile = useCallback((file: File) => {
    // Import the validation function dynamically to avoid circular dependencies
    import('@/lib/utils/validation').then(({ validateProfilePicture }) => {
      const result = validateProfilePicture(file);
      setValidationResult(result);
    });
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: []
    });
  }, []);

  return {
    validationResult,
    validateFile,
    clearValidation,
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    hasErrors: validationResult.errors.length > 0,
    hasWarnings: validationResult.warnings.length > 0
  };
}
