import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useFormValidation, useDeveloperProfileValidation, useClientProfileValidation, useProfilePictureValidation } from '../useFormValidation';
import { UpdateDeveloperProfileRequest, UpdateClientProfileRequest } from '@/types/api';

// Mock the validation utilities
vi.mock('@/lib/utils/validation', () => ({
  validateFieldRealTime: vi.fn((fieldName: string, value: any) => ({
    isValid: true,
    value,
    error: undefined,
    warning: undefined
  })),
  getFormValidationState: vi.fn(() => ({})),
  isFormValid: vi.fn(() => true),
  getFormErrors: vi.fn(() => []),
  getFormWarnings: vi.fn(() => []),
  sanitizeFormData: vi.fn((data) => data),
  debounce: vi.fn((fn) => fn),
  validateProfilePicture: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: []
  })),
}));

describe('useFormValidation', () => {
  const mockDeveloperData: UpdateDeveloperProfileRequest = {
    skills: ['JavaScript', 'React'],
    experience: 5,
    hourlyRate: 75,
    currency: 'USD',
    availability: { available: true },
    portfolioLinks: {},
    education: {},
    workPreferences: {},
    bio: 'Experienced developer',
  };

  const mockClientData: UpdateClientProfileRequest = {
    companyName: 'Tech Corp',
    companyWebsite: 'https://techcorp.com',
    contactEmail: 'contact@techcorp.com',
    contactPerson: 'John Doe',
    contactPhone: '+1234567890',
    companyDescription: 'Technology company',
    companySize: '10-50',
    industry: 'Technology',
    bio: 'Technology company',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDeveloperProfileValidation', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.warnings).toEqual([]);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.hasWarnings).toBe(false);
      expect(result.current.validationState).toEqual({});
    });

    it('should validate a field', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        const validationResult = result.current.validateField('skills', ['JavaScript']);
        expect(validationResult).toBeDefined();
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.value).toEqual(['JavaScript']);
      });
    });

    it('should validate entire form', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        const validationResult = result.current.validateForm(mockDeveloperData);
        expect(validationResult).toBeDefined();
      });
    });

    it('should handle field blur', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        result.current.handleFieldBlur('skills', ['JavaScript']);
      });

      expect(result.current.isFieldTouched('skills')).toBe(true);
    });

    it('should handle field change', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        result.current.handleFieldChange('skills', ['JavaScript', 'React']);
      });

      expect(result.current.isFieldTouched('skills')).toBe(true);
    });

    it('should clear validation for specific field', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        result.current.handleFieldChange('skills', ['JavaScript']);
        result.current.clearValidation('skills');
      });

      expect(result.current.isFieldTouched('skills')).toBe(false);
    });

    it('should clear all validation', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        result.current.handleFieldChange('skills', ['JavaScript']);
        result.current.handleFieldChange('experience', 5);
        result.current.clearAllValidation();
      });

      expect(result.current.isFieldTouched('skills')).toBe(false);
      expect(result.current.isFieldTouched('experience')).toBe(false);
    });

    it('should create field props', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const fieldProps = result.current.createFieldProps('skills');

      expect(fieldProps).toHaveProperty('onBlur');
      expect(fieldProps).toHaveProperty('onChange');
      expect(fieldProps).toHaveProperty('error');
      expect(fieldProps).toHaveProperty('warning');
      expect(fieldProps).toHaveProperty('isValid');
      expect(fieldProps).toHaveProperty('isTouched');
      expect(fieldProps).toHaveProperty('hasError');
      expect(fieldProps).toHaveProperty('hasWarning');
    });

    it('should check if form can be submitted', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const canSubmit = result.current.canSubmit(mockDeveloperData);
      expect(typeof canSubmit).toBe('boolean');
      expect(canSubmit).toBe(true); // Should be true for valid data
    });

    it('should get submission errors', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const errors = result.current.getSubmissionErrors(mockDeveloperData);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors).toEqual([]); // Should be empty for valid data
    });

    it('should sanitize and validate form data', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const { data, isValid, errors } = result.current.sanitizeAndValidate(mockDeveloperData);

      expect(data).toBeDefined();
      expect(typeof isValid).toBe('boolean');
      expect(Array.isArray(errors)).toBe(true);
      expect(isValid).toBe(true); // Should be true for valid data
      expect(errors).toEqual([]); // Should be empty for valid data
    });
  });

  describe('useClientProfileValidation', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useClientProfileValidation());

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.warnings).toEqual([]);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.hasWarnings).toBe(false);
      expect(result.current.validationState).toEqual({});
    });

    it('should validate client-specific fields', () => {
      const { result } = renderHook(() => useClientProfileValidation());

      act(() => {
        const validationResult = result.current.validateField('companyName', 'Tech Corp');
        expect(validationResult).toBeDefined();
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.value).toBe('Tech Corp');
      });
    });

    it('should validate entire client form', () => {
      const { result } = renderHook(() => useClientProfileValidation());

      act(() => {
        const validationResult = result.current.validateForm(mockClientData);
        expect(validationResult).toBeDefined();
      });
    });

    it('should handle client field blur', () => {
      const { result } = renderHook(() => useClientProfileValidation());

      act(() => {
        result.current.handleFieldBlur('companyName', 'Tech Corp');
      });

      expect(result.current.isFieldTouched('companyName')).toBe(true);
    });

    it('should handle client field change', () => {
      const { result } = renderHook(() => useClientProfileValidation());

      act(() => {
        result.current.handleFieldChange('companyName', 'New Tech Corp');
      });

      expect(result.current.isFieldTouched('companyName')).toBe(true);
    });
  });

  describe('useProfilePictureValidation', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProfilePictureValidation());

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.warnings).toEqual([]);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.hasWarnings).toBe(false);
    });

    it('should validate file', () => {
      const { result } = renderHook(() => useProfilePictureValidation());
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.validateFile(mockFile);
      });

      expect(result.current.isValid).toBe(true);
    });

    it('should clear validation', () => {
      const { result } = renderHook(() => useProfilePictureValidation());

      act(() => {
        result.current.clearValidation();
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
    });
  });

  describe('Validation Options', () => {
    it('should respect validateOnChange option', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation({
        validateOnChange: false
      }));

      act(() => {
        result.current.handleFieldChange('skills', ['JavaScript']);
      });

      expect(result.current.isFieldTouched('skills')).toBe(false);
    });

    it('should respect validateOnBlur option', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation({
        validateOnBlur: false
      }));

      act(() => {
        result.current.handleFieldBlur('skills', ['JavaScript']);
      });

      expect(result.current.isFieldTouched('skills')).toBe(false);
    });

    it('should respect debounce option', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation({
        debounceMs: 100
      }));

      act(() => {
        result.current.handleFieldChange('skills', ['JavaScript']);
      });

      expect(result.current.isFieldTouched('skills')).toBe(true);
    });
  });

  describe('Field-specific Helpers', () => {
    it('should get field error', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const error = result.current.getFieldError('skills');
      expect(error).toBeUndefined(); // No error by default
    });

    it('should get field warning', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const warning = result.current.getFieldWarning('skills');
      expect(warning).toBeUndefined(); // No warning by default
    });

    it('should check if field is valid', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const isValid = result.current.isFieldValid('skills');
      expect(isValid).toBe(true); // Valid by default
    });

    it('should check if field is touched', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const isTouched = result.current.isFieldTouched('skills');
      expect(isTouched).toBe(false); // Not touched by default
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        result.current.validateField('invalidField', 'value');
      });

      // Should not throw an error
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty form data', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        const validationResult = result.current.validateForm({} as UpdateDeveloperProfileRequest);
        expect(validationResult).toBeDefined();
      });
    });

    it('should handle null field values', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        const validationResult = result.current.validateField('skills', null);
        expect(validationResult).toBeDefined();
        expect(validationResult.isValid).toBe(true); // Null is valid for non-required fields
        expect(validationResult.value).toBe(null);
      });
    });

    it('should handle undefined field values', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      act(() => {
        const validationResult = result.current.validateField('skills', undefined);
        expect(validationResult).toBeDefined();
        expect(validationResult.isValid).toBe(true); // Undefined is valid for non-required fields
        expect(validationResult.value).toBe(undefined);
      });
    });

    it('should handle non-existent fields', () => {
      const { result } = renderHook(() => useDeveloperProfileValidation());

      const error = result.current.getFieldError('nonExistentField');
      expect(error).toBeUndefined();
    });
  });
});
