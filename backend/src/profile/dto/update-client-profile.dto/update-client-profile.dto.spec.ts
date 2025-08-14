import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { 
  LocationDto,
  BillingAddressDto,
  CustomLinkDto,
  SocialLinksDto,
  ProjectPreferencesDto,
  UpdateClientProfileDto 
} from './update-client-profile.dto';

describe('LocationDto', () => {
  it('should validate valid location', async () => {
    const dto = plainToClass(LocationDto, {
      country: 'USA',
      city: 'New York',
      state: 'NY',
      timezone: 'UTC-5'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(LocationDto, {
      country: 'USA',
      city: 'New York'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(LocationDto, {
      country: 'USA'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid data types', async () => {
    const dto = plainToClass(LocationDto, {
      country: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('BillingAddressDto', () => {
  it('should validate valid billing address', async () => {
    const dto = plainToClass(BillingAddressDto, {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(BillingAddressDto, {
      street: '123 Main St',
      city: 'New York'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(BillingAddressDto, {
      street: '123 Main St'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid data types', async () => {
    const dto = plainToClass(BillingAddressDto, {
      street: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('CustomLinkDto', () => {
  it('should validate valid custom link', async () => {
    const dto = plainToClass(CustomLinkDto, {
      label: 'Facebook',
      url: 'https://facebook.com/company',
      description: 'Company Facebook page'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal required data', async () => {
    const dto = plainToClass(CustomLinkDto, {
      label: 'Facebook',
      url: 'https://facebook.com/company'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without required label', async () => {
    const dto = plainToClass(CustomLinkDto, {
      url: 'https://facebook.com/company'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without required url', async () => {
    const dto = plainToClass(CustomLinkDto, {
      label: 'Facebook'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid data types', async () => {
    const dto = plainToClass(CustomLinkDto, {
      label: 123, // Should be string
      url: 'https://facebook.com/company'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SocialLinksDto', () => {
  it('should validate valid social links', async () => {
    const dto = plainToClass(SocialLinksDto, {
      linkedin: 'https://linkedin.com/company',
      website: 'https://company.com',
      x: 'https://twitter.com/company',
      customLinks: [
        {
          label: 'Facebook',
          url: 'https://facebook.com/company',
          description: 'Company Facebook page'
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(SocialLinksDto, {
      linkedin: 'https://linkedin.com/company'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only custom links', async () => {
    const dto = plainToClass(SocialLinksDto, {
      customLinks: [
        {
          label: 'Facebook',
          url: 'https://facebook.com/company'
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid custom links', async () => {
    const dto = plainToClass(SocialLinksDto, {
      customLinks: [
        {
          label: 'Facebook'
          // Missing required url
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ProjectPreferencesDto', () => {
  it('should validate valid project preferences', async () => {
    const dto = plainToClass(ProjectPreferencesDto, {
      typicalProjectBudget: '1k-5k',
      typicalProjectDuration: '1-3 months',
      preferredCommunication: ['email', 'chat'],
      timezonePreference: 'UTC+3',
      projectTypes: ['web', 'mobile']
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(ProjectPreferencesDto, {
      typicalProjectBudget: '1k-5k'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal data', async () => {
    const dto = plainToClass(ProjectPreferencesDto, {
      typicalProjectBudget: '1k-5k'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid array values', async () => {
    const dto = plainToClass(ProjectPreferencesDto, {
      preferredCommunication: 'not-an-array'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid data types', async () => {
    const dto = plainToClass(ProjectPreferencesDto, {
      typicalProjectBudget: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateClientProfileDto', () => {
  it('should validate valid client profile update', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyName: 'Tech Co.',
      companyWebsite: 'https://techco.com',
      companySize: '51-200',
      industry: 'Technology',
      companyDescription: 'Leading tech solutions provider',
      contactPerson: 'Jane Doe',
      contactEmail: 'contact@techco.com',
      contactPhone: '+1234567890',
      location: {
        country: 'USA',
        city: 'New York',
        state: 'NY',
        timezone: 'UTC-5'
      },
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      projectPreferences: {
        typicalProjectBudget: '1k-5k',
        typicalProjectDuration: '1-3 months',
        preferredCommunication: ['email', 'chat'],
        timezonePreference: 'UTC+3',
        projectTypes: ['web', 'mobile']
      },
      socialLinks: {
        linkedin: 'https://linkedin.com/company',
        website: 'https://company.com',
        x: 'https://twitter.com/company',
        customLinks: [
          {
            label: 'Facebook',
            url: 'https://facebook.com/company',
            description: 'Company Facebook page'
          }
        ]
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyName: 'Tech Co.',
      contactEmail: 'contact@techco.com'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only company information', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyName: 'Tech Co.',
      companyWebsite: 'https://techco.com',
      companySize: '51-200',
      industry: 'Technology'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only contact information', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      contactPerson: 'Jane Doe',
      contactEmail: 'contact@techco.com',
      contactPhone: '+1234567890'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only location information', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      location: {
        country: 'USA',
        city: 'New York',
        state: 'NY',
        timezone: 'UTC-5'
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only billing address', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only project preferences', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      projectPreferences: {
        typicalProjectBudget: '1k-5k',
        typicalProjectDuration: '1-3 months',
        preferredCommunication: ['email', 'chat'],
        timezonePreference: 'UTC+3',
        projectTypes: ['web', 'mobile']
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only social links', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      socialLinks: {
        linkedin: 'https://linkedin.com/company',
        website: 'https://company.com',
        x: 'https://twitter.com/company'
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with custom social links', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      socialLinks: {
        customLinks: [
          {
            label: 'Facebook',
            url: 'https://facebook.com/company',
            description: 'Company Facebook page'
          },
          {
            label: 'Instagram',
            url: 'https://instagram.com/company'
          }
        ]
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal project preferences', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      projectPreferences: {
        typicalProjectBudget: '1k-5k'
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal location', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      location: {
        country: 'USA'
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal billing address', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      billingAddress: {
        street: '123 Main St',
        city: 'New York'
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid email format', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      contactEmail: 'invalid-email'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid URL format', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyWebsite: 'not-a-url'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid nested object structure', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      location: {
        country: 123 // Should be string
      }
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid array in nested object', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      projectPreferences: {
        preferredCommunication: 'not-an-array'
      }
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid custom link structure', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      socialLinks: {
        customLinks: [
          {
            label: 'Facebook'
            // Missing required url
          }
        ]
      }
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate empty object', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with null values for optional fields', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyName: 'Tech Co.',
      companyDescription: null,
      contactPhone: null
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with undefined values for optional fields', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyName: 'Tech Co.',
      companyDescription: undefined,
      contactPhone: undefined
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate complex nested structure', async () => {
    const dto = plainToClass(UpdateClientProfileDto, {
      companyName: 'Tech Co.',
      companyWebsite: 'https://techco.com',
      companySize: '51-200',
      industry: 'Technology',
      companyDescription: 'Leading tech solutions provider',
      contactPerson: 'Jane Doe',
      contactEmail: 'contact@techco.com',
      contactPhone: '+1234567890',
      location: {
        country: 'USA',
        city: 'New York',
        state: 'NY',
        timezone: 'UTC-5'
      },
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      projectPreferences: {
        typicalProjectBudget: '1k-5k',
        typicalProjectDuration: '1-3 months',
        preferredCommunication: ['email', 'chat', 'phone'],
        timezonePreference: 'UTC+3',
        projectTypes: ['web', 'mobile', 'desktop']
      },
      socialLinks: {
        linkedin: 'https://linkedin.com/company',
        website: 'https://company.com',
        x: 'https://twitter.com/company',
        customLinks: [
          {
            label: 'Facebook',
            url: 'https://facebook.com/company',
            description: 'Company Facebook page'
          },
          {
            label: 'Instagram',
            url: 'https://instagram.com/company',
            description: 'Company Instagram page'
          },
          {
            label: 'YouTube',
            url: 'https://youtube.com/company'
          }
        ]
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
