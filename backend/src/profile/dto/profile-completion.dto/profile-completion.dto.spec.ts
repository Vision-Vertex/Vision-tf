import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CompletionBreakdownDto,
  ProfileCompletionDto,
  CompletionStatsDto,
  FieldValidationDto,
  ProfileValidationDto,
  RequiredFieldDto,
  ProfileRequiredFieldsDto,
} from './profile-completion.dto';

describe('CompletionBreakdownDto', () => {
  it('should validate valid completion breakdown', async () => {
    const dto = plainToClass(CompletionBreakdownDto, {
      overall: 85,
      breakdown: {
        basic: 100,
        professional: 80,
        availability: 60,
        contact: 100,
      },
      missingFields: ['location', 'hourlyRate'],
      suggestions: [
        'Add your location to help with timezone coordination',
        'Set your hourly rate to help clients understand your pricing',
      ],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for invalid overall percentage', async () => {
    const dto = plainToClass(CompletionBreakdownDto, {
      overall: 150, // Invalid: > 100
      breakdown: { basic: 100 },
      missingFields: [],
      suggestions: [],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.max).toBeDefined();
  });

  it('should fail validation for negative overall percentage', async () => {
    const dto = plainToClass(CompletionBreakdownDto, {
      overall: -10, // Invalid: < 0
      breakdown: { basic: 100 },
      missingFields: [],
      suggestions: [],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.min).toBeDefined();
  });
});

describe('ProfileCompletionDto', () => {
  it('should validate valid profile completion', async () => {
    const dto = plainToClass(ProfileCompletionDto, {
      completion: {
        overall: 85,
        breakdown: { basic: 100, professional: 80 },
        missingFields: ['location'],
        suggestions: ['Add your location'],
      },
      userId: 'uuid-string',
      lastUpdated: '2025-01-15T10:30:00Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for missing userId', async () => {
    const dto = plainToClass(ProfileCompletionDto, {
      completion: {
        overall: 85,
        breakdown: { basic: 100 },
        missingFields: [],
        suggestions: [],
      },
      lastUpdated: '2025-01-15T10:30:00Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isString).toBeDefined();
  });
});

describe('CompletionStatsDto', () => {
  it('should validate valid completion stats', async () => {
    const dto = plainToClass(CompletionStatsDto, {
      averageCompletion: 75,
      completionDistribution: {
        '0-25': 10,
        '26-50': 25,
        '51-75': 40,
        '76-100': 25,
      },
      lowCompletionCount: 10,
      totalProfiles: 100,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for negative average completion', async () => {
    const dto = plainToClass(CompletionStatsDto, {
      averageCompletion: -5,
      completionDistribution: {},
      lowCompletionCount: 0,
      totalProfiles: 100,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.min).toBeDefined(); // Changed from isNumber to min
  });
});

describe('FieldValidationDto', () => {
  it('should validate valid field validation', async () => {
    const dto = plainToClass(FieldValidationDto, {
      field: 'displayName',
      isValid: true,
      value: 'John Doe',
      required: true,
      errorMessage: undefined, // Explicitly set to undefined
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate field validation with error message', async () => {
    const dto = plainToClass(FieldValidationDto, {
      field: 'displayName',
      isValid: false,
      errorMessage: 'Display name is required',
      value: '',
      required: true,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for missing field', async () => {
    const dto = plainToClass(FieldValidationDto, {
      isValid: true,
      value: 'John Doe',
      required: true,
      errorMessage: undefined,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isString).toBeDefined();
  });
});

describe('ProfileValidationDto', () => {
  it('should validate valid profile validation', async () => {
    const dto = plainToClass(ProfileValidationDto, {
      isValid: true,
      validFieldsCount: 8,
      invalidFieldsCount: 2,
      totalFieldsCount: 10,
      validationPercentage: 80,
      fieldValidations: [
        {
          field: 'displayName',
          isValid: true,
          value: 'John Doe',
          required: true,
          errorMessage: undefined,
        },
        {
          field: 'bio',
          isValid: false,
          errorMessage: 'Bio is required',
          value: '',
          required: true,
        },
      ],
      userId: 'uuid-string',
      validatedAt: '2025-01-15T10:30:00Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for invalid validation percentage', async () => {
    const dto = plainToClass(ProfileValidationDto, {
      isValid: true,
      validFieldsCount: 8,
      invalidFieldsCount: 2,
      totalFieldsCount: 10,
      validationPercentage: 150, // Invalid: > 100
      fieldValidations: [],
      userId: 'uuid-string',
      validatedAt: '2025-01-15T10:30:00Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.max).toBeDefined();
  });

  it('should fail validation for negative validation percentage', async () => {
    const dto = plainToClass(ProfileValidationDto, {
      isValid: true,
      validFieldsCount: 8,
      invalidFieldsCount: 2,
      totalFieldsCount: 10,
      validationPercentage: -10, // Invalid: < 0
      fieldValidations: [],
      userId: 'uuid-string',
      validatedAt: '2025-01-15T10:30:00Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.min).toBeDefined();
  });
});

describe('RequiredFieldDto', () => {
  it('should validate valid required field', async () => {
    const dto = plainToClass(RequiredFieldDto, {
      field: 'displayName',
      displayName: 'Display Name',
      description: 'Your public display name',
      category: 'basic',
      required: true,
      type: 'string',
      validationRules: { minLength: 2, maxLength: 50 },
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required field without validation rules', async () => {
    const dto = plainToClass(RequiredFieldDto, {
      field: 'availability',
      displayName: 'Availability',
      description: 'Your availability schedule',
      category: 'availability',
      required: true,
      type: 'object',
      validationRules: {}, // Empty object instead of undefined
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for missing field', async () => {
    const dto = plainToClass(RequiredFieldDto, {
      displayName: 'Display Name',
      description: 'Your public display name',
      category: 'basic',
      required: true,
      type: 'string',
      validationRules: {},
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isString).toBeDefined();
  });
});

describe('ProfileRequiredFieldsDto', () => {
  it('should validate valid profile required fields', async () => {
    const dto = plainToClass(ProfileRequiredFieldsDto, {
      role: 'DEVELOPER',
      requiredFields: [
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
      ],
      totalRequiredFields: 2,
      completedRequiredFields: 1,
      requiredFieldsCompletion: 50,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for invalid completion percentage', async () => {
    const dto = plainToClass(ProfileRequiredFieldsDto, {
      role: 'DEVELOPER',
      requiredFields: [],
      totalRequiredFields: 2,
      completedRequiredFields: 1,
      requiredFieldsCompletion: 150, // Invalid: > 100
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.max).toBeDefined();
  });

  it('should fail validation for negative completion percentage', async () => {
    const dto = plainToClass(ProfileRequiredFieldsDto, {
      role: 'DEVELOPER',
      requiredFields: [],
      totalRequiredFields: 2,
      completedRequiredFields: 1,
      requiredFieldsCompletion: -10, // Invalid: < 0
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.min).toBeDefined();
  });

  it('should fail validation for missing role', async () => {
    const dto = plainToClass(ProfileRequiredFieldsDto, {
      requiredFields: [],
      totalRequiredFields: 2,
      completedRequiredFields: 1,
      requiredFieldsCompletion: 50,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isString).toBeDefined();
  });
});
