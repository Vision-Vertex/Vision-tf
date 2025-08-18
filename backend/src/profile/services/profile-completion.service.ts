import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface CompletionBreakdown {
  overall: number;
  breakdown: Record<string, number>;
  missingFields: string[];
  suggestions: string[];
}

export interface CompletionCategory {
  name: string;
  fields: string[];
  weight: number;
  suggestions: Record<string, string>;
}

export interface FieldValidation {
  field: string;
  isValid: boolean;
  errorMessage?: string;
  value: string;
  required: boolean;
}

export interface ProfileValidation {
  isValid: boolean;
  validFieldsCount: number;
  invalidFieldsCount: number;
  totalFieldsCount: number;
  validationPercentage: number;
  fieldValidations: FieldValidation[];
}

export interface RequiredField {
  field: string;
  displayName: string;
  description: string;
  category: string;
  required: boolean;
  type: string;
  validationRules?: Record<string, any>;
}

@Injectable()
export class ProfileCompletionService {
  private readonly completionCategories: CompletionCategory[] = [
    {
      name: 'basic',
      fields: ['displayName', 'bio'],
      weight: 20,
      suggestions: {
        displayName: 'Add your display name to make your profile more personal',
        bio: 'Add a bio to tell others about yourself and your expertise',
      },
    },
    {
      name: 'professional',
      fields: ['skills', 'experience', 'hourlyRate'],
      weight: 35,
      suggestions: {
        skills: 'Add your skills to showcase your expertise',
        experience: 'Add your years of experience',
        hourlyRate:
          'Set your hourly rate to help clients understand your pricing',
      },
    },
    {
      name: 'availability',
      fields: ['availability', 'location'],
      weight: 25,
      suggestions: {
        availability:
          "Set your availability to help clients know when you're free",
        location: 'Add your location to help with timezone coordination',
      },
    },
    {
      name: 'contact',
      fields: ['contactEmail', 'contactPhone'],
      weight: 20,
      suggestions: {
        contactEmail: 'Add your contact email for direct communication',
        contactPhone: 'Add your phone number for urgent communications',
      },
    },
  ];

  private readonly requiredFieldsByRole: Record<UserRole, RequiredField[]> = {
    [UserRole.DEVELOPER]: [
      {
        field: 'displayName',
        displayName: 'Display Name',
        description: 'Your public display name',
        category: 'basic',
        required: true,
        type: 'string',
        validationRules: { minLength: 2, maxLength: 50 },
      },
      {
        field: 'bio',
        displayName: 'Bio',
        description: 'Brief description about yourself',
        category: 'basic',
        required: true,
        type: 'string',
        validationRules: { minLength: 10, maxLength: 500 },
      },
      {
        field: 'skills',
        displayName: 'Skills',
        description: 'Your technical skills and expertise',
        category: 'professional',
        required: true,
        type: 'array',
        validationRules: { minLength: 1, maxLength: 20 },
      },
      {
        field: 'experience',
        displayName: 'Years of Experience',
        description: 'Your professional experience in years',
        category: 'professional',
        required: true,
        type: 'number',
        validationRules: { min: 0, max: 50 },
      },
      {
        field: 'hourlyRate',
        displayName: 'Hourly Rate',
        description: 'Your hourly rate in USD',
        category: 'professional',
        required: true,
        type: 'number',
        validationRules: { min: 1, max: 1000 },
      },
      {
        field: 'availability',
        displayName: 'Availability',
        description: 'Your availability schedule',
        category: 'availability',
        required: true,
        type: 'object',
      },
      {
        field: 'location',
        displayName: 'Location',
        description: 'Your location information',
        category: 'availability',
        required: true,
        type: 'object',
      },
      {
        field: 'contactEmail',
        displayName: 'Contact Email',
        description: 'Your contact email address',
        category: 'contact',
        required: true,
        type: 'string',
        validationRules: { isEmail: true },
      },
    ],
    [UserRole.CLIENT]: [
      {
        field: 'displayName',
        displayName: 'Display Name',
        description: 'Your public display name',
        category: 'basic',
        required: true,
        type: 'string',
        validationRules: { minLength: 2, maxLength: 50 },
      },
      {
        field: 'bio',
        displayName: 'Bio',
        description: 'Brief description about your company or project needs',
        category: 'basic',
        required: true,
        type: 'string',
        validationRules: { minLength: 10, maxLength: 500 },
      },
      {
        field: 'companyName',
        displayName: 'Company Name',
        description: 'Your company name',
        category: 'professional',
        required: true,
        type: 'string',
        validationRules: { minLength: 2, maxLength: 100 },
      },
      {
        field: 'companyDescription',
        displayName: 'Company Description',
        description: 'Description of your company',
        category: 'professional',
        required: true,
        type: 'string',
        validationRules: { minLength: 10, maxLength: 1000 },
      },
      {
        field: 'contactEmail',
        displayName: 'Contact Email',
        description: 'Your contact email address',
        category: 'contact',
        required: true,
        type: 'string',
        validationRules: { isEmail: true },
      },
      {
        field: 'contactPhone',
        displayName: 'Contact Phone',
        description: 'Your contact phone number',
        category: 'contact',
        required: true,
        type: 'string',
        validationRules: { isPhoneNumber: true },
      },
    ],
    [UserRole.ADMIN]: [
      {
        field: 'displayName',
        displayName: 'Display Name',
        description: 'Your public display name',
        category: 'basic',
        required: true,
        type: 'string',
        validationRules: { minLength: 2, maxLength: 50 },
      },
      {
        field: 'bio',
        displayName: 'Bio',
        description: 'Brief description about yourself',
        category: 'basic',
        required: true,
        type: 'string',
        validationRules: { minLength: 10, maxLength: 500 },
      },
      {
        field: 'contactEmail',
        displayName: 'Contact Email',
        description: 'Your contact email address',
        category: 'contact',
        required: true,
        type: 'string',
        validationRules: { isEmail: true },
      },
    ],
  };

  /**
   * Calculate profile completion with optimized performance
   * Uses single pass through profile data with minimal object creation
   */
  calculateCompletion(profile: any): CompletionBreakdown {
    if (!profile) {
      return this.getEmptyCompletion();
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;
    const missingFields: string[] = [];
    const suggestions: string[] = [];
    const breakdown: Record<string, number> = {};

    // Single pass through categories for optimal performance
    for (const category of this.completionCategories) {
      const categoryScore = this.calculateCategoryScore(profile, category);
      const categoryPercentage =
        (categoryScore.completed / category.fields.length) * 100;

      breakdown[category.name] = Math.round(categoryPercentage);
      totalWeightedScore += categoryPercentage * category.weight;
      totalWeight += category.weight;

      // Collect missing fields and suggestions
      categoryScore.missing.forEach((field) => {
        missingFields.push(field);
        if (category.suggestions[field]) {
          suggestions.push(category.suggestions[field]);
        }
      });
    }

    const overall =
      totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

    return {
      overall,
      breakdown,
      missingFields,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions for UX
    };
  }

  /**
   * Calculate completion for a specific category
   * Optimized to avoid repeated property access
   */
  private calculateCategoryScore(
    profile: any,
    category: CompletionCategory,
  ): {
    completed: number;
    missing: string[];
  } {
    let completed = 0;
    const missing: string[] = [];

    for (const field of category.fields) {
      if (this.isFieldComplete(profile, field)) {
        completed++;
      } else {
        missing.push(field);
      }
    }

    return { completed, missing };
  }

  /**
   * Check if a field is complete with optimized validation
   * Handles different data types efficiently
   */
  private isFieldComplete(profile: Record<string, unknown>, field: string): boolean {
    const value = this.getNestedValue(profile, field);

    if (value === null || value === undefined) {
      return false;
    }

    // Handle different data types
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      // For objects like location, availability, check if they have meaningful content
      return (
        Object.keys(value).length > 0 &&
        Object.values(value).some(
          (v) => v !== null && v !== undefined && v !== '',
        )
      );
    }

    return true;
  }

  /**
   * Get nested object value safely
   * Handles dot notation like 'user.email'
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Get empty completion result for null/undefined profiles
   */
  private getEmptyCompletion(): CompletionBreakdown {
    return {
      overall: 0,
      breakdown: this.completionCategories.reduce(
        (acc, category) => {
          acc[category.name] = 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
      missingFields: this.completionCategories.flatMap(
        (category) => category.fields,
      ),
      suggestions: [
        'Start by adding your basic information',
        'Complete your professional details',
        'Set your availability and contact information',
      ],
    };
  }

  /**
   * Get completion statistics for admin dashboard
   * Optimized for bulk calculations
   */
  getCompletionStats(profiles: Record<string, unknown>[]): {
    averageCompletion: number;
    completionDistribution: Record<string, number>;
    lowCompletionCount: number;
  } {
    if (!profiles || profiles.length === 0) {
      return {
        averageCompletion: 0,
        completionDistribution: {},
        lowCompletionCount: 0,
      };
    }

    let totalCompletion = 0;
    let lowCompletionCount = 0;
    const distribution: Record<string, number> = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-100': 0,
    };

    // Single pass through profiles
    for (const profile of profiles) {
      const completion = this.calculateCompletion(profile);
      totalCompletion += completion.overall;

      // Categorize completion levels
      if (completion.overall <= 25) {
        distribution['0-25']++;
        lowCompletionCount++;
      } else if (completion.overall <= 50) {
        distribution['26-50']++;
      } else if (completion.overall <= 75) {
        distribution['51-75']++;
      } else {
        distribution['76-100']++;
      }
    }

    return {
      averageCompletion: Math.round(totalCompletion / profiles.length),
      completionDistribution: distribution,
      lowCompletionCount,
    };
  }

  /**
   * Validate profile fields and return detailed validation results
   * Optimized for performance with single pass validation
   */
  validateProfile(profile: any, role: UserRole): ProfileValidation {
    if (!profile) {
      return this.getEmptyValidation(role);
    }

    const requiredFields = this.requiredFieldsByRole[role] || [];
    const fieldValidations: FieldValidation[] = [];
    let validFieldsCount = 0;
    let invalidFieldsCount = 0;

    // Single pass through required fields
    for (const requiredField of requiredFields) {
      const validation = this.validateField(profile, requiredField);
      fieldValidations.push(validation);

      if (validation.isValid) {
        validFieldsCount++;
      } else {
        invalidFieldsCount++;
      }
    }

    const totalFieldsCount = requiredFields.length;
    const validationPercentage =
      totalFieldsCount > 0
        ? Math.round((validFieldsCount / totalFieldsCount) * 100)
        : 0;

    return {
      isValid: invalidFieldsCount === 0,
      validFieldsCount,
      invalidFieldsCount,
      totalFieldsCount,
      validationPercentage,
      fieldValidations,
    };
  }

  /**
   * Get required fields for a specific role
   * Returns detailed field information with validation rules
   */
  getRequiredFields(
    role: UserRole,
    profile?: any,
  ): {
    role: string;
    requiredFields: RequiredField[];
    totalRequiredFields: number;
    completedRequiredFields: number;
    requiredFieldsCompletion: number;
  } {
    const requiredFields = this.requiredFieldsByRole[role] || [];
    let completedRequiredFields = 0;

    if (profile) {
      // Count completed required fields
      for (const requiredField of requiredFields) {
        if (this.isFieldComplete(profile, requiredField.field)) {
          completedRequiredFields++;
        }
      }
    }

    const totalRequiredFields = requiredFields.length;
    const requiredFieldsCompletion =
      totalRequiredFields > 0
        ? Math.round((completedRequiredFields / totalRequiredFields) * 100)
        : 0;

    return {
      role,
      requiredFields,
      totalRequiredFields,
      completedRequiredFields,
      requiredFieldsCompletion,
    };
  }

  /**
   * Validate a single field against its requirements
   * Handles different data types and validation rules
   */
  private validateField(
    profile: Record<string, unknown>,
    requiredField: RequiredField,
  ): FieldValidation {
    const value = this.getNestedValue(profile, requiredField.field);
    const stringValue = this.valueToString(value);
    let isValid = true;
    let errorMessage: string | undefined;

    // Check if field is complete
    if (!this.isFieldComplete(profile, requiredField.field)) {
      isValid = false;
      errorMessage = `${requiredField.displayName} is required`;
    } else if (requiredField.validationRules) {
      // Apply validation rules
      const validationResult = this.applyValidationRules(
        stringValue,
        requiredField.validationRules,
      );
      if (!validationResult.isValid) {
        isValid = false;
        errorMessage = validationResult.errorMessage;
      }
    }

    return {
      field: requiredField.field,
      isValid,
      errorMessage,
      value: stringValue,
      required: requiredField.required,
    };
  }

  /**
   * Apply validation rules to a field value
   * Supports common validation patterns
   */
  private applyValidationRules(
    value: string,
    rules: Record<string, unknown>,
  ): {
    isValid: boolean;
    errorMessage?: string;
  } {
    // String length validation
    if (rules.minLength && typeof rules.minLength === 'number' && value.length < rules.minLength) {
      return {
        isValid: false,
        errorMessage: `Minimum length is ${rules.minLength} characters`,
      };
    }

    if (rules.maxLength && typeof rules.maxLength === 'number' && value.length > rules.maxLength) {
      return {
        isValid: false,
        errorMessage: `Maximum length is ${rules.maxLength} characters`,
      };
    }

    // Number validation
    if (rules.min !== undefined && !isNaN(Number(value))) {
      const numValue = Number(value);
      if (rules.min !== null && rules.min !== undefined && typeof rules.min === 'number' && numValue < rules.min) {
        return {
          isValid: false,
          errorMessage: `Minimum value is ${rules.min}`,
        };
      }
    }

    if (rules.max !== undefined && !isNaN(Number(value))) {
      const numValue = Number(value);
      if (rules.max !== null && rules.max !== undefined && typeof rules.max === 'number' && numValue > rules.max) {
        return {
          isValid: false,
          errorMessage: `Maximum value is ${rules.max}`,
        };
      }
    }

    // Email validation
    if (rules.isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          isValid: false,
          errorMessage: 'Invalid email format',
        };
      }
    }

    // Phone validation
    if (rules.isPhoneNumber) {
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-()]/g, ''))) {
        return {
          isValid: false,
          errorMessage: 'Invalid phone number format',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Convert any value to string for validation
   * Handles different data types gracefully
   */
  private valueToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Get empty validation result for null/undefined profiles
   */
  private getEmptyValidation(role: UserRole): ProfileValidation {
    const requiredFields = this.requiredFieldsByRole[role] || [];
    const fieldValidations: FieldValidation[] = requiredFields.map((field) => ({
      field: field.field,
      isValid: false,
      errorMessage: `${field.displayName} is required`,
      value: '',
      required: field.required,
    }));

    return {
      isValid: false,
      validFieldsCount: 0,
      invalidFieldsCount: requiredFields.length,
      totalFieldsCount: requiredFields.length,
      validationPercentage: 0,
      fieldValidations,
    };
  }
}
