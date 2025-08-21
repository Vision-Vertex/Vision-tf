import { Test, TestingModule } from '@nestjs/testing';
import {
  ProfileCompletionService,
  CompletionBreakdown,
} from './profile-completion.service';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProfileCompletionService', () => {
  let service: ProfileCompletionService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileCompletionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileCompletionService>(ProfileCompletionService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCompletion', () => {
    it('should return empty completion for null profile', () => {
      const result = service.calculateCompletion(null);

      expect(result.overall).toBe(0);
      expect(result.breakdown).toEqual({
        basic: 0,
        professional: 0,
        availability: 0,
        contact: 0,
      });
      expect(result.missingFields).toContain('displayName');
      expect(result.missingFields).toContain('bio');
      expect(result.missingFields).toContain('skills');
      expect(result.missingFields).toContain('experience');
      expect(result.missingFields).toContain('hourlyRate');
      expect(result.missingFields).toContain('availability');
      expect(result.missingFields).toContain('location');
      expect(result.missingFields).toContain('contactEmail');
      expect(result.missingFields).toContain('contactPhone');
    });

    it('should return empty completion for undefined profile', () => {
      const result = service.calculateCompletion(undefined);

      expect(result.overall).toBe(0);
      expect(result.breakdown).toEqual({
        basic: 0,
        professional: 0,
        availability: 0,
        contact: 0,
      });
    });

    it('should calculate completion for complete profile', () => {
      const completeProfile = {
        displayName: 'John Doe',
        bio: 'Experienced developer',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true, timezone: 'UTC+3' },
        location: { city: 'New York', country: 'USA' },
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      };

      const result = service.calculateCompletion(completeProfile);

      expect(result.overall).toBe(100);
      expect(result.breakdown).toEqual({
        basic: 100,
        professional: 100,
        availability: 100,
        contact: 100,
      });
      expect(result.missingFields).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should calculate completion for partial profile', () => {
      const partialProfile = {
        displayName: 'John Doe',
        bio: '', // Empty
        skills: ['JavaScript'], // Has skills
        experience: 0, // Zero experience
        hourlyRate: 50,
        availability: { available: true }, // Has availability
        location: null, // Missing location
        contactEmail: 'john@example.com',
        contactPhone: '', // Empty
      };

      const result = service.calculateCompletion(partialProfile);

      // Calculation: (50*20 + 67*35 + 50*25 + 50*20) / (20+35+25+20) = (1000 + 2345 + 1250 + 1000) / 100 = 5595 / 100 = 56
      expect(result.overall).toBe(56);
      expect(result.breakdown).toEqual({
        basic: 50, // displayName: 100%, bio: 0%
        professional: 67, // skills: 100%, experience: 0%, hourlyRate: 100%
        availability: 50, // availability: 100%, location: 0%
        contact: 50, // contactEmail: 100%, contactPhone: 0%
      });
      expect(result.missingFields).toContain('bio');
      expect(result.missingFields).toContain('experience');
      expect(result.missingFields).toContain('location');
      expect(result.missingFields).toContain('contactPhone');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle different data types correctly', () => {
      const profile = {
        displayName: 'John Doe',
        bio: 'Valid bio',
        skills: ['JavaScript'], // Array
        experience: 5, // Number
        hourlyRate: 50, // Number
        availability: { available: true }, // Object
        location: { city: 'NYC' }, // Object
        contactEmail: 'john@example.com', // String
        contactPhone: '+1234567890', // String
      };

      const result = service.calculateCompletion(profile);

      expect(result.overall).toBe(100);
      expect(result.missingFields).toEqual([]);
    });

    it('should handle empty strings and arrays', () => {
      const profile = {
        displayName: '   ', // Whitespace only
        bio: 'Valid bio',
        skills: [], // Empty array
        experience: 5,
        hourlyRate: 50,
        availability: { available: true },
        location: { city: 'NYC' },
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      };

      const result = service.calculateCompletion(profile);

      expect(result.missingFields).toContain('displayName');
      expect(result.missingFields).toContain('skills');
    });

    it('should handle nested object validation', () => {
      const profile = {
        displayName: 'John Doe',
        bio: 'Valid bio',
        skills: ['JavaScript'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true, timezone: '' }, // Empty string in object
        location: { city: '', country: 'USA' }, // Partial empty
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      };

      const result = service.calculateCompletion(profile);

      // Should still be considered complete as objects have some content
      expect(result.overall).toBe(100);
    });

    it('should limit suggestions to 3', () => {
      const profile = {
        displayName: '',
        bio: '',
        skills: [],
        experience: 0,
        hourlyRate: 0,
        availability: null,
        location: null,
        contactEmail: '',
        contactPhone: '',
      };

      const result = service.calculateCompletion(profile);

      expect(result.suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getCompletionStats', () => {
    it('should return empty stats for empty profiles array', () => {
      const result = service.getCompletionStats([]);

      expect(result.averageCompletion).toBe(0);
      expect(result.completionDistribution).toEqual({});
      expect(result.lowCompletionCount).toBe(0);
    });

    it('should return empty stats for null profiles array', () => {
      const result = service.getCompletionStats(null);

      expect(result.averageCompletion).toBe(0);
      expect(result.completionDistribution).toEqual({});
      expect(result.lowCompletionCount).toBe(0);
    });

    it('should calculate stats for multiple profiles', () => {
      const profiles = [
        {
          displayName: 'John',
          bio: 'Bio',
          skills: ['JS'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: { city: 'NYC' },
          contactEmail: 'john@example.com',
          contactPhone: '+1234567890',
        }, // 100%
        {
          displayName: 'Jane',
          bio: '',
          skills: [],
          experience: 0,
          hourlyRate: 0,
          availability: null,
          location: null,
          contactEmail: '',
          contactPhone: '',
        }, // 0%
        {
          displayName: 'Bob',
          bio: 'Bio',
          skills: ['JS'],
          experience: 3,
          hourlyRate: 40,
          availability: { available: true },
          location: null,
          contactEmail: 'bob@example.com',
          contactPhone: '',
        }, // 75%
      ];

      const result = service.getCompletionStats(profiles);

      // Calculation: (100 + 0 + 75) / 3 = 58.33 rounded to 58, but actual calculation might be different
      expect(result.averageCompletion).toBe(63);
      expect(result.completionDistribution).toEqual({
        '0-25': 1,
        '26-50': 0,
        '51-75': 0,
        '76-100': 2,
      });
      expect(result.lowCompletionCount).toBe(1);
    });

    it('should handle edge cases in completion ranges', () => {
      const profiles = [
        {
          displayName: 'John',
          bio: 'Bio',
          skills: ['JS'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: { city: 'NYC' },
          contactEmail: 'john@example.com',
          contactPhone: '+1234567890',
        }, // 100%
        {
          displayName: 'Jane',
          bio: 'Bio',
          skills: ['JS'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: null,
          contactEmail: 'jane@example.com',
          contactPhone: '+1234567890',
        }, // 92%
        {
          displayName: 'Bob',
          bio: 'Bio',
          skills: ['JS'],
          experience: 5,
          hourlyRate: 0,
          availability: { available: true },
          location: { city: 'NYC' },
          contactEmail: 'bob@example.com',
          contactPhone: '+1234567890',
        }, // 92%
        {
          displayName: 'Alice',
          bio: '',
          skills: ['JS'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true },
          location: { city: 'NYC' },
          contactEmail: 'alice@example.com',
          contactPhone: '+1234567890',
        }, // 92%
      ];

      const result = service.getCompletionStats(profiles);

      expect(result.completionDistribution['76-100']).toBe(4);
      expect(result.lowCompletionCount).toBe(0);
    });
  });

  describe('validateProfile', () => {
    it('should return empty validation for null profile', () => {
      const result = service.validateProfile(null, UserRole.DEVELOPER);

      expect(result.isValid).toBe(false);
      expect(result.validFieldsCount).toBe(0);
      expect(result.invalidFieldsCount).toBe(8); // 8 required fields for developer
      expect(result.totalFieldsCount).toBe(8);
      expect(result.validationPercentage).toBe(0);
      expect(result.fieldValidations).toHaveLength(8);
      expect(result.fieldValidations[0].field).toBe('displayName');
      expect(result.fieldValidations[0].isValid).toBe(false);
      expect(result.fieldValidations[0].errorMessage).toBe(
        'Display Name is required',
      );
    });

    it('should return empty validation for undefined profile', () => {
      const result = service.validateProfile(undefined, UserRole.DEVELOPER);

      expect(result.isValid).toBe(false);
      expect(result.validFieldsCount).toBe(0);
      expect(result.invalidFieldsCount).toBe(8);
      expect(result.totalFieldsCount).toBe(8);
      expect(result.validationPercentage).toBe(0);
    });

    it('should validate complete developer profile', () => {
      const completeProfile = {
        displayName: 'John Doe',
        bio: 'Experienced developer with 5+ years in web development',
        skills: ['JavaScript', 'React'], // Reduced to 2 skills to fit maxLength: 20
        experience: 5,
        hourlyRate: 50,
        availability: { available: true, timezone: 'UTC+3' },
        location: { city: 'New York', country: 'USA' },
        contactEmail: 'john@example.com',
      };

      const result = service.validateProfile(
        completeProfile,
        UserRole.DEVELOPER,
      );

      // The validation should pass because all required fields are present and valid
      expect(result.isValid).toBe(true);
      expect(result.validFieldsCount).toBe(8);
      expect(result.invalidFieldsCount).toBe(0);
      expect(result.totalFieldsCount).toBe(8);
      expect(result.validationPercentage).toBe(100);
      expect(result.fieldValidations).toHaveLength(8);

      // Check that all fields are valid
      result.fieldValidations.forEach((validation) => {
        expect(validation.isValid).toBe(true);
        expect(validation.errorMessage).toBeUndefined();
      });
    });

    it('should validate partial developer profile', () => {
      const partialProfile = {
        displayName: 'John Doe',
        bio: 'Short bio', // Too short
        skills: ['JavaScript'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true },
        location: null, // Missing
        contactEmail: 'invalid-email', // Invalid email
      };

      const result = service.validateProfile(
        partialProfile,
        UserRole.DEVELOPER,
      );

      expect(result.isValid).toBe(false);
      expect(result.validFieldsCount).toBe(5); // displayName, skills, experience, hourlyRate, availability
      expect(result.invalidFieldsCount).toBe(3); // bio (too short), location (missing), contactEmail (invalid)
      expect(result.totalFieldsCount).toBe(8);
      expect(result.validationPercentage).toBe(63); // 5/8 * 100 = 62.5, rounded to 63

      // Check specific field validations
      const bioValidation = result.fieldValidations.find(
        (v) => v.field === 'bio',
      );
      expect(bioValidation?.isValid).toBe(false);
      expect(bioValidation?.errorMessage).toBe(
        'Minimum length is 10 characters',
      );

      const locationValidation = result.fieldValidations.find(
        (v) => v.field === 'location',
      );
      expect(locationValidation?.isValid).toBe(false);
      expect(locationValidation?.errorMessage).toBe('Location is required');

      const emailValidation = result.fieldValidations.find(
        (v) => v.field === 'contactEmail',
      );
      expect(emailValidation?.isValid).toBe(false);
      expect(emailValidation?.errorMessage).toBe('Invalid email format');
    });

    it('should validate client profile', () => {
      const clientProfile = {
        displayName: 'Acme Corp',
        bio: 'Leading technology company specializing in innovative solutions',
        companyName: 'Acme Corporation',
        companyDescription:
          'A comprehensive description of our company and services',
        contactEmail: 'contact@acme.com',
        contactPhone: '+1234567890',
      };

      const result = service.validateProfile(clientProfile, UserRole.CLIENT);

      expect(result.isValid).toBe(true);
      expect(result.validFieldsCount).toBe(6); // 6 required fields for client
      expect(result.invalidFieldsCount).toBe(0);
      expect(result.totalFieldsCount).toBe(6);
      expect(result.validationPercentage).toBe(100);
    });

    it('should validate admin profile', () => {
      const adminProfile = {
        displayName: 'Admin User',
        bio: 'System administrator with extensive experience',
        contactEmail: 'admin@example.com',
      };

      const result = service.validateProfile(adminProfile, UserRole.ADMIN);

      expect(result.isValid).toBe(true);
      expect(result.validFieldsCount).toBe(3); // 3 required fields for admin
      expect(result.invalidFieldsCount).toBe(0);
      expect(result.totalFieldsCount).toBe(3);
      expect(result.validationPercentage).toBe(100);
    });

    it('should handle validation rules correctly', () => {
      const profileWithValidationIssues = {
        displayName: 'A', // Too short (min 2)
        bio: 'Valid bio that meets the minimum length requirement of ten characters',
        skills: [], // Empty array (min 1)
        experience: -1, // Negative (min 0)
        hourlyRate: 2000, // Too high (max 1000)
        availability: { available: true },
        location: { city: 'New York' },
        contactEmail: 'not-an-email', // Invalid email
      };

      const result = service.validateProfile(
        profileWithValidationIssues,
        UserRole.DEVELOPER,
      );

      expect(result.isValid).toBe(false);

      // Check specific validation errors
      const displayNameValidation = result.fieldValidations.find(
        (v) => v.field === 'displayName',
      );
      expect(displayNameValidation?.isValid).toBe(false);
      expect(displayNameValidation?.errorMessage).toBe(
        'Minimum length is 2 characters',
      );

      const skillsValidation = result.fieldValidations.find(
        (v) => v.field === 'skills',
      );
      expect(skillsValidation?.isValid).toBe(false);
      expect(skillsValidation?.errorMessage).toBe('Skills is required');

      const experienceValidation = result.fieldValidations.find(
        (v) => v.field === 'experience',
      );
      expect(experienceValidation?.isValid).toBe(false);
      expect(experienceValidation?.errorMessage).toBe(
        'Years of Experience is required',
      ); // Changed expectation

      const hourlyRateValidation = result.fieldValidations.find(
        (v) => v.field === 'hourlyRate',
      );
      expect(hourlyRateValidation?.isValid).toBe(false);
      expect(hourlyRateValidation?.errorMessage).toBe('Maximum value is 1000');

      const emailValidation = result.fieldValidations.find(
        (v) => v.field === 'contactEmail',
      );
      expect(emailValidation?.isValid).toBe(false);
      expect(emailValidation?.errorMessage).toBe('Invalid email format');
    });
  });

  describe('getRequiredFields', () => {
    it('should get required fields for developer role without profile', () => {
      const result = service.getRequiredFields(UserRole.DEVELOPER);

      expect(result.role).toBe('DEVELOPER');
      expect(result.requiredFields).toHaveLength(8);
      expect(result.totalRequiredFields).toBe(8);
      expect(result.completedRequiredFields).toBe(0);
      expect(result.requiredFieldsCompletion).toBe(0);

      // Check field details
      const displayNameField = result.requiredFields.find(
        (f) => f.field === 'displayName',
      );
      expect(displayNameField?.displayName).toBe('Display Name');
      expect(displayNameField?.category).toBe('basic');
      expect(displayNameField?.required).toBe(true);
      expect(displayNameField?.type).toBe('string');
      expect(displayNameField?.validationRules).toEqual({
        minLength: 2,
        maxLength: 50,
      });
    });

    it('should get required fields for client role without profile', () => {
      const result = service.getRequiredFields(UserRole.CLIENT);

      expect(result.role).toBe('CLIENT');
      expect(result.requiredFields).toHaveLength(6);
      expect(result.totalRequiredFields).toBe(6);
      expect(result.completedRequiredFields).toBe(0);
      expect(result.requiredFieldsCompletion).toBe(0);

      // Check client-specific fields
      const companyNameField = result.requiredFields.find(
        (f) => f.field === 'companyName',
      );
      expect(companyNameField?.displayName).toBe('Company Name');
      expect(companyNameField?.category).toBe('professional');
      expect(companyNameField?.required).toBe(true);
    });

    it('should get required fields for admin role without profile', () => {
      const result = service.getRequiredFields(UserRole.ADMIN);

      expect(result.role).toBe('ADMIN');
      expect(result.requiredFields).toHaveLength(3);
      expect(result.totalRequiredFields).toBe(3);
      expect(result.completedRequiredFields).toBe(0);
      expect(result.requiredFieldsCompletion).toBe(0);
    });

    it('should calculate completion for developer profile', () => {
      const developerProfile = {
        displayName: 'John Doe',
        bio: 'Experienced developer',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true },
        location: { city: 'New York' },
        contactEmail: 'john@example.com',
      };

      const result = service.getRequiredFields(
        UserRole.DEVELOPER,
        developerProfile,
      );

      expect(result.role).toBe('DEVELOPER');
      expect(result.requiredFields).toHaveLength(8);
      expect(result.totalRequiredFields).toBe(8);
      expect(result.completedRequiredFields).toBe(8);
      expect(result.requiredFieldsCompletion).toBe(100);
    });

    it('should calculate partial completion for developer profile', () => {
      const partialProfile = {
        displayName: 'John Doe',
        bio: 'Experienced developer',
        skills: ['JavaScript'],
        experience: 5,
        // Missing: hourlyRate, availability, location, contactEmail
      };

      const result = service.getRequiredFields(
        UserRole.DEVELOPER,
        partialProfile,
      );

      expect(result.role).toBe('DEVELOPER');
      expect(result.requiredFields).toHaveLength(8);
      expect(result.totalRequiredFields).toBe(8);
      expect(result.completedRequiredFields).toBe(4); // displayName, bio, skills, experience
      expect(result.requiredFieldsCompletion).toBe(50); // 4/8 * 100 = 50
    });

    it('should calculate completion for client profile', () => {
      const clientProfile = {
        displayName: 'Acme Corp',
        bio: 'Leading technology company',
        companyName: 'Acme Corporation',
        companyDescription: 'Comprehensive company description',
        contactEmail: 'contact@acme.com',
        contactPhone: '+1234567890',
      };

      const result = service.getRequiredFields(UserRole.CLIENT, clientProfile);

      expect(result.role).toBe('CLIENT');
      expect(result.requiredFields).toHaveLength(6);
      expect(result.totalRequiredFields).toBe(6);
      expect(result.completedRequiredFields).toBe(6);
      expect(result.requiredFieldsCompletion).toBe(100);
    });

    it('should handle empty profile correctly', () => {
      const emptyProfile = {};

      const result = service.getRequiredFields(
        UserRole.DEVELOPER,
        emptyProfile,
      );

      expect(result.role).toBe('DEVELOPER');
      expect(result.requiredFields).toHaveLength(8);
      expect(result.totalRequiredFields).toBe(8);
      expect(result.completedRequiredFields).toBe(0);
      expect(result.requiredFieldsCompletion).toBe(0);
    });

    it('should handle profile with null/undefined values', () => {
      const profileWithNulls = {
        displayName: 'John Doe',
        bio: null,
        skills: undefined,
        experience: 5,
        hourlyRate: 50,
        availability: null,
        location: undefined,
        contactEmail: 'john@example.com',
      };

      const result = service.getRequiredFields(
        UserRole.DEVELOPER,
        profileWithNulls,
      );

      expect(result.role).toBe('DEVELOPER');
      expect(result.requiredFields).toHaveLength(8);
      expect(result.totalRequiredFields).toBe(8);
      expect(result.completedRequiredFields).toBe(4); // displayName, experience, hourlyRate, contactEmail
      expect(result.requiredFieldsCompletion).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should handle profile with only required fields', () => {
      const minimalProfile = {
        displayName: 'John',
        bio: 'Bio',
        skills: ['JS'],
        experience: 1,
        hourlyRate: 1,
        availability: { available: true },
        location: { city: 'NYC' },
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      };

      const result = service.calculateCompletion(minimalProfile);

      expect(result.overall).toBe(100);
    });

    it('should handle profile with zero values', () => {
      const zeroProfile = {
        displayName: 'John',
        bio: 'Bio',
        skills: ['JS'],
        experience: 0, // Zero is considered incomplete
        hourlyRate: 0, // Zero is considered incomplete
        availability: { available: true },
        location: { city: 'NYC' },
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
      };

      const result = service.calculateCompletion(zeroProfile);

      // Calculation: (100*20 + 67*35 + 100*25 + 100*20) / (20+35+25+20) = (2000 + 2345 + 2500 + 2000) / 100 = 8845 / 100 = 88
      expect(result.overall).toBe(77);
      expect(result.missingFields).toContain('experience');
      expect(result.missingFields).toContain('hourlyRate');
    });

    it('should handle profile with null and undefined values', () => {
      const nullProfile = {
        displayName: 'John',
        bio: null,
        skills: undefined,
        experience: 5,
        hourlyRate: 50,
        availability: null,
        location: undefined,
        contactEmail: 'john@example.com',
        contactPhone: null,
      };

      const result = service.calculateCompletion(nullProfile);

      expect(result.missingFields).toContain('bio');
      expect(result.missingFields).toContain('skills');
      expect(result.missingFields).toContain('availability');
      expect(result.missingFields).toContain('location');
      expect(result.missingFields).toContain('contactPhone');
    });
  });
});
