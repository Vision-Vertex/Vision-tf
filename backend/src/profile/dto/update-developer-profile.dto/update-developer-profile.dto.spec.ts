import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { 
  AvailabilityDto, 
  PortfolioLinkDto, 
  PortfolioLinksDto, 
  CertificationDto, 
  EducationDto, 
  WorkPreferencesDto, 
  UpdateDeveloperProfileDto,
  AddSkillDto,
  AvailabilityResponseDto
} from './update-developer-profile.dto';

describe('AvailabilityDto', () => {
  it('should validate valid availability settings', async () => {
    const dto = plainToClass(AvailabilityDto, {
      available: true,
      hours: '9-5',
      timezone: 'UTC+3',
      noticePeriod: '2 weeks',
      maxHoursPerWeek: 40,
      preferredProjectTypes: ['web', 'mobile']
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(AvailabilityDto, {
      available: true,
      timezone: 'UTC+3'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid boolean values', async () => {
    const dto = plainToClass(AvailabilityDto, {
      available: 'invalid'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid number values', async () => {
    const dto = plainToClass(AvailabilityDto, {
      maxHoursPerWeek: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid array values', async () => {
    const dto = plainToClass(AvailabilityDto, {
      preferredProjectTypes: 'not-an-array'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PortfolioLinkDto', () => {
  it('should validate valid portfolio link', async () => {
    const dto = plainToClass(PortfolioLinkDto, {
      label: 'Instagram',
      url: 'https://instagram.com/user',
      description: 'Portfolio showcase'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal required data', async () => {
    const dto = plainToClass(PortfolioLinkDto, {
      label: 'Instagram',
      url: 'https://instagram.com/user'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without required label', async () => {
    const dto = plainToClass(PortfolioLinkDto, {
      url: 'https://instagram.com/user'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without required url', async () => {
    const dto = plainToClass(PortfolioLinkDto, {
      label: 'Instagram'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PortfolioLinksDto', () => {
  it('should validate valid portfolio links', async () => {
    const dto = plainToClass(PortfolioLinksDto, {
      github: 'https://github.com/user',
      linkedin: 'https://linkedin.com/in/user',
      website: 'https://userwebsite.com',
      x: 'https://twitter.com/user',
      customLinks: [
        {
          label: 'Instagram',
          url: 'https://instagram.com/user',
          description: 'Portfolio showcase'
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(PortfolioLinksDto, {
      github: 'https://github.com/user'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid custom links', async () => {
    const dto = plainToClass(PortfolioLinksDto, {
      customLinks: [
        {
          label: 'Instagram'
          // Missing required url
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('CertificationDto', () => {
  it('should validate valid certification', async () => {
    const dto = plainToClass(CertificationDto, {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon',
      dateObtained: '2023-01-15',
      expiryDate: '2025-01-15',
      credentialId: '12345-abcde'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with minimal required data', async () => {
    const dto = plainToClass(CertificationDto, {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon',
      dateObtained: '2023-01-15'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without required name', async () => {
    const dto = plainToClass(CertificationDto, {
      issuer: 'Amazon',
      dateObtained: '2023-01-15'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without required issuer', async () => {
    const dto = plainToClass(CertificationDto, {
      name: 'AWS Certified Solutions Architect',
      dateObtained: '2023-01-15'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without required dateObtained', async () => {
    const dto = plainToClass(CertificationDto, {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('EducationDto', () => {
  it('should validate valid education', async () => {
    const dto = plainToClass(EducationDto, {
      degree: "Bachelor's in Computer Science",
      institution: 'MIT',
      graduationYear: 2020,
      certifications: [
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon',
          dateObtained: '2023-01-15'
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(EducationDto, {
      degree: "Bachelor's in Computer Science"
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid graduation year', async () => {
    const dto = plainToClass(EducationDto, {
      graduationYear: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid certifications', async () => {
    const dto = plainToClass(EducationDto, {
      certifications: [
        {
          name: 'AWS Certified Solutions Architect'
          // Missing required fields
        }
      ]
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('WorkPreferencesDto', () => {
  it('should validate valid work preferences', async () => {
    const dto = plainToClass(WorkPreferencesDto, {
      remoteWork: true,
      onSiteWork: true,
      hybridWork: true,
      travelWillingness: 'national',
      contractTypes: ['hourly', 'fixed'],
      minProjectDuration: '1-2 weeks',
      maxProjectDuration: '6+ months'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(WorkPreferencesDto, {
      remoteWork: true
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid boolean values', async () => {
    const dto = plainToClass(WorkPreferencesDto, {
      remoteWork: 'invalid'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid array values', async () => {
    const dto = plainToClass(WorkPreferencesDto, {
      contractTypes: 'not-an-array'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateDeveloperProfileDto', () => {
  it('should validate valid developer profile update', async () => {
    const dto = plainToClass(UpdateDeveloperProfileDto, {
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: 5,
      hourlyRate: 50.0,
      currency: 'USD',
      availability: {
        available: true,
        hours: '9-5',
        timezone: 'UTC+3'
      },
      portfolioLinks: {
        github: 'https://github.com/user',
        linkedin: 'https://linkedin.com/in/user'
      },
      education: {
        degree: "Bachelor's in Computer Science",
        institution: 'MIT'
      },
      workPreferences: {
        remoteWork: true,
        contractTypes: ['hourly', 'fixed']
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(UpdateDeveloperProfileDto, {
      skills: ['JavaScript', 'React']
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid experience', async () => {
    const dto = plainToClass(UpdateDeveloperProfileDto, {
      experience: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid hourly rate', async () => {
    const dto = plainToClass(UpdateDeveloperProfileDto, {
      hourlyRate: 'not-a-number'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid skills array', async () => {
    const dto = plainToClass(UpdateDeveloperProfileDto, {
      skills: 'not-an-array'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid nested objects', async () => {
    const dto = plainToClass(UpdateDeveloperProfileDto, {
      availability: {
        available: 'invalid'
      }
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('AddSkillDto', () => {
  it('should validate valid skill addition', async () => {
    const dto = plainToClass(AddSkillDto, {
      skill: 'TypeScript'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without required skill', async () => {
    const dto = plainToClass(AddSkillDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with empty skill string', async () => {
    const dto = plainToClass(AddSkillDto, {
      skill: ''
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('AvailabilityResponseDto', () => {
  it('should validate valid availability response', async () => {
    const dto = plainToClass(AvailabilityResponseDto, {
      availability: {
        available: true,
        timezone: 'UTC+3'
      },
      workPreferences: {
        remoteWork: true,
        contractTypes: ['hourly']
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(AvailabilityResponseDto, {
      availability: {
        available: true
      }
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid nested objects', async () => {
    const dto = plainToClass(AvailabilityResponseDto, {
      availability: {
        available: 'invalid'
      }
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
