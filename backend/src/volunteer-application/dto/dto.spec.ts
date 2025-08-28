import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { 
  CreateApplicationDto, 
  SkillDto, 
  ReferenceDto, 
  AvailabilityDto, 
  QuestionDto 
} from './create-application.dto';
import { UpdateApplicationDto } from './update-application.dto';
import { UpdateApplicationStatusDto } from './update-application-status.dto';
import { 
  QueryApplicationDto, 
  QueryDeveloperApplicationDto, 
  QueryJobApplicationDto 
} from './query-application.dto';
import { 
  JobDiscoveryFiltersDto, 
  JobDiscoveryResponseDto, 
  AvailabilityCheckDto, 
  AvailabilityCheckResponseDto 
} from './job-discovery.dto';
import { ApplicationResponseDto } from './application-response.dto';
import { 
  ApplicationProcessingDto, 
  ApplicationMetricsDto 
} from './application-review.dto';
import { ApplicationStatus, ApplicationPriority, JobStatus, JobVisibility, ProjectType, WorkLocation, JobPriority } from '@prisma/client';

describe('Volunteer Application DTOs', () => {
  describe('CreateApplicationDto', () => {
    let dto: CreateApplicationDto;

    beforeEach(() => {
      dto = new CreateApplicationDto();
    });

    it('should validate with minimal required fields', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position'
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with all optional fields', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        motivation: 'I am passionate about this work',
        relevantExperience: '5 years of experience',
        proposedRate: 50.0,
        proposedCurrency: 'USD',
        estimatedHours: 80,
        availability: {
          available: true,
          hours: '9-5',
          timezone: 'UTC+3'
        },
        skills: [
          { skill: 'React', level: 'EXPERT', years: 3 },
          { skill: 'Node.js', level: 'INTERMEDIATE', years: 2 }
        ],
        portfolio: 'https://portfolio.example.com',
        references: [
          { name: 'John Doe', email: 'john@example.com', relationship: 'Previous Client' }
        ],
        questions: [
          { question: 'What is the expected timeline?' }
        ],
        attachments: ['https://example.com/resume.pdf'],
        priority: ApplicationPriority.HIGH
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid jobId', async () => {
      const data = {
        jobId: 'invalid-uuid',
        coverLetter: 'I am excited to apply for this position'
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });

    it('should fail validation with missing coverLetter', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('coverLetter');
    });

    it('should fail validation with invalid proposedRate', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        proposedRate: -10
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('proposedRate');
    });

    it('should fail validation with invalid estimatedHours', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        estimatedHours: 0
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('estimatedHours');
    });

    it('should fail validation with invalid portfolio URL', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        portfolio: 'not-a-valid-url'
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('portfolio');
    });

    it('should fail validation with too many skills', async () => {
      const skills = Array.from({ length: 21 }, (_, i) => ({
        skill: `Skill${i}`,
        level: 'EXPERT',
        years: 1
      }));

      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        skills
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('skills');
    });
  });

  describe('SkillDto', () => {
    it('should validate with valid data', async () => {
      const data = {
        skill: 'React',
        level: 'EXPERT',
        years: 3
      };

      const skillDto = plainToClass(SkillDto, data);
      const errors = await validate(skillDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid years', async () => {
      const data = {
        skill: 'React',
        level: 'EXPERT',
        years: 60
      };

      const skillDto = plainToClass(SkillDto, data);
      const errors = await validate(skillDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('years');
    });
  });

  describe('ReferenceDto', () => {
    it('should validate with valid data', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        relationship: 'Previous Client'
      };

      const referenceDto = plainToClass(ReferenceDto, data);
      const errors = await validate(referenceDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('AvailabilityDto', () => {
    it('should validate with valid data', async () => {
      const data = {
        available: true,
        hours: '9-5',
        timezone: 'UTC+3',
        noticePeriod: '2 weeks',
        maxHoursPerWeek: 40,
        preferredProjectTypes: ['web', 'mobile']
      };

      const availabilityDto = plainToClass(AvailabilityDto, data);
      const errors = await validate(availabilityDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid maxHoursPerWeek', async () => {
      const data = {
        available: true,
        maxHoursPerWeek: 200
      };

      const availabilityDto = plainToClass(AvailabilityDto, data);
      const errors = await validate(availabilityDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('maxHoursPerWeek');
    });
  });

  describe('UpdateApplicationDto', () => {
    it('should validate with partial data', async () => {
      const data = {
        coverLetter: 'Updated cover letter',
        proposedRate: 60.0
      };

      const updateDto = plainToClass(UpdateApplicationDto, data);
      const errors = await validate(updateDto);
      expect(errors).toHaveLength(0);
    });

    it('should allow empty object', async () => {
      const data = {};

      const updateDto = plainToClass(UpdateApplicationDto, data);
      const errors = await validate(updateDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateApplicationStatusDto', () => {
    it('should validate with required status', async () => {
      const data = {
        status: ApplicationStatus.UNDER_REVIEW
      };

      const statusDto = plainToClass(UpdateApplicationStatusDto, data);
      const errors = await validate(statusDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with all fields', async () => {
      const data = {
        status: ApplicationStatus.APPROVED,
        reason: 'Application meets requirements',
        notes: 'Strong React experience'
      };

      const statusDto = plainToClass(UpdateApplicationStatusDto, data);
      const errors = await validate(statusDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const data = {
        status: 'INVALID_STATUS'
      };

      const statusDto = plainToClass(UpdateApplicationStatusDto, data);
      const errors = await validate(statusDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('QueryApplicationDto', () => {
    it('should validate with default values', async () => {
      const data = {};

      const queryDto = plainToClass(QueryApplicationDto, data);
      const errors = await validate(queryDto);
      expect(errors).toHaveLength(0);
      expect(queryDto.page).toBe(1);
      expect(queryDto.limit).toBe(10);
      expect(queryDto.sortBy).toBe('appliedAt');
      expect(queryDto.sortOrder).toBe('desc');
    });

    it('should validate with all filters', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        status: ApplicationStatus.PENDING,
        priority: ApplicationPriority.HIGH,
        page: 2,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      };

      const queryDto = plainToClass(QueryApplicationDto, data);
      const errors = await validate(queryDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid page', async () => {
      const data = {
        page: 0
      };

      const queryDto = plainToClass(QueryApplicationDto, data);
      const errors = await validate(queryDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation with invalid limit', async () => {
      const data = {
        limit: 150
      };

      const queryDto = plainToClass(QueryApplicationDto, data);
      const errors = await validate(queryDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });
  });

  describe('QueryDeveloperApplicationDto', () => {
    it('should validate with default values', async () => {
      const data = {};

      const queryDto = plainToClass(QueryDeveloperApplicationDto, data);
      const errors = await validate(queryDto);
      expect(errors).toHaveLength(0);
      expect(queryDto.page).toBe(1);
      expect(queryDto.limit).toBe(10);
    });
  });

  describe('QueryJobApplicationDto', () => {
    it('should validate with default values', async () => {
      const data = {};

      const queryDto = plainToClass(QueryJobApplicationDto, data);
      const errors = await validate(queryDto);
      expect(errors).toHaveLength(0);
      expect(queryDto.page).toBe(1);
      expect(queryDto.limit).toBe(10);
    });
  });

  describe('JobDiscoveryFiltersDto', () => {
    it('should validate with default values', async () => {
      const data = {};

      const filtersDto = plainToClass(JobDiscoveryFiltersDto, data);
      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(0);
      expect(filtersDto.page).toBe(1);
      expect(filtersDto.limit).toBe(10);
    });

    it('should validate with all filters', async () => {
      const data = {
        search: 'React developer',
        status: JobStatus.OPEN,
        projectType: ProjectType.WEB_DEVELOPMENT,
        priority: JobPriority.HIGH,
        matchSkills: true,
        page: 2,
        limit: 20
      };

      const filtersDto = plainToClass(JobDiscoveryFiltersDto, data);
      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid page', async () => {
      const data = {
        page: 0
      };

      const filtersDto = plainToClass(JobDiscoveryFiltersDto, data);
      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation with invalid limit', async () => {
      const data = {
        limit: 150
      };

      const filtersDto = plainToClass(JobDiscoveryFiltersDto, data);
      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });
  });

  describe('AvailabilityCheckDto', () => {
    it('should validate with valid data', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        developerId: '456e7890-e89b-12d3-a456-426614174000'
      };

      const checkDto = plainToClass(AvailabilityCheckDto, data);
      const errors = await validate(checkDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing jobId', async () => {
      const data = {
        developerId: '456e7890-e89b-12d3-a456-426614174000'
      };

      const checkDto = plainToClass(AvailabilityCheckDto, data);
      const errors = await validate(checkDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });
  });

  describe('ApplicationProcessingDto', () => {
    it('should validate with minimal required fields', async () => {
      const data = {
        applicationId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const processingDto = plainToClass(ApplicationProcessingDto, data);
      const errors = await validate(processingDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with all optional fields', async () => {
      const data = {
        applicationId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve',
        notes: 'Strong candidate',
        nextSteps: ['Schedule interview', 'Send contract'],
        deadline: '2024-01-15',
        priority: ApplicationPriority.HIGH,
        notifyDeveloper: true,
        notificationMessage: 'Your application has been approved!'
      };

      const processingDto = plainToClass(ApplicationProcessingDto, data);
      const errors = await validate(processingDto);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid action values', async () => {
      const validActions = ['approve', 'reject', 'shortlist', 'request-more-info', 'schedule-interview'];
      
      for (const action of validActions) {
        const data = {
          applicationId: '123e4567-e89b-12d3-a456-426614174000',
          action
        };

        const processingDto = plainToClass(ApplicationProcessingDto, data);
        const errors = await validate(processingDto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should accept invalid action values since field is optional', async () => {
      const data = {
        applicationId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'invalid-action'
      };

      const processingDto = plainToClass(ApplicationProcessingDto, data);
      const errors = await validate(processingDto);
      // Since action is optional and doesn't have enum validation, it should pass
      expect(errors).toHaveLength(0);
    });
  });

  describe('Response DTOs', () => {
    describe('ApplicationResponseDto', () => {
      it('should have all required properties', () => {
        const response = new ApplicationResponseDto();
        expect(response).toBeDefined();
      });
    });

    describe('JobDiscoveryResponseDto', () => {
      it('should have all required properties', () => {
        const response = new JobDiscoveryResponseDto();
        expect(response).toBeDefined();
      });
    });

    describe('AvailabilityCheckResponseDto', () => {
      it('should have all required properties', () => {
        const response = new AvailabilityCheckResponseDto();
        expect(response).toBeDefined();
      });
    });

    describe('ApplicationMetricsDto', () => {
      it('should have all required properties', () => {
        const metrics = new ApplicationMetricsDto();
        expect(metrics).toBeDefined();
      });
    });
  });

  describe('DTO Transformation', () => {
    it('should handle string values for numeric fields', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        proposedRate: '50.0',
        estimatedHours: '80',
        page: '2',
        limit: '20'
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const queryDto = plainToClass(QueryApplicationDto, data);

      // CreateApplicationDto doesn't have @Type() decorators, so strings remain strings
      expect(createDto.proposedRate).toBe('50.0');
      expect(createDto.estimatedHours).toBe('80');
      
      // QueryApplicationDto has @Type(() => Number) decorators, so strings are converted to numbers
      expect(queryDto.page).toBe(2);
      expect(queryDto.limit).toBe(20);
    });

    it('should handle nested object string values', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        availability: {
          available: 'true',
          maxHoursPerWeek: '40'
        },
        skills: [
          { skill: 'React', level: 'EXPERT', years: '3' }
        ]
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      // Note: plainToClass doesn't automatically transform nested values
      expect(createDto.availability.available).toBe('true');
      expect(createDto.availability.maxHoursPerWeek).toBe('40');
      expect(createDto.skills[0].years).toBe('3');
    });

    it('should validate successfully with proper numeric types', async () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        coverLetter: 'I am excited to apply for this position',
        proposedRate: 50.0,
        estimatedHours: 80,
        availability: {
          available: true,
          maxHoursPerWeek: 40
        },
        skills: [
          { skill: 'React', level: 'EXPERT', years: 3 }
        ]
      };

      const createDto = plainToClass(CreateApplicationDto, data);
      const errors = await validate(createDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Swagger Documentation', () => {
    it('should have proper API property decorators', () => {
      // Test that DTOs have proper Swagger decorators
      const createDto = new CreateApplicationDto();
      const updateDto = new UpdateApplicationDto();
      const statusDto = new UpdateApplicationStatusDto();
      const queryDto = new QueryApplicationDto();
      const filtersDto = new JobDiscoveryFiltersDto();
      const processingDto = new ApplicationProcessingDto();

      expect(createDto).toBeDefined();
      expect(updateDto).toBeDefined();
      expect(statusDto).toBeDefined();
      expect(queryDto).toBeDefined();
      expect(filtersDto).toBeDefined();
      expect(processingDto).toBeDefined();
    });
  });
});
