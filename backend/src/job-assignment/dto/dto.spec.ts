import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateJobAssignmentDto } from './create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './update-job-assignment.dto';
import { ChangeStatusDto } from './change-status.dto';

import { CreateTeamDto } from './create-team.dto';
import { AssignTeamDto } from './assign-team.dto';
import { CreateTeamAndAssignDto } from './create-assign-team.dto';
import { UpdateTeamAssignmentStatusDto } from './update-team-assignment.dto';
import { AssignmentStatsQueryDto } from './assignment-stats.dto';
import { DeveloperSuggestionDto } from './developer-suggestion.dto';
import { ScoreJobRequestDto, ScoreResponseItemDto, ScoreJobResponseDto, UpdateScoringConfigDto, ScoringAlgorithmType } from './scoring.dto';
import { CreateStatusHistoryDto, StatusHistoryQueryDto } from './status-history.dto';
import { AssignmentStatus } from '@prisma/client';

describe('Job Assignment DTOs', () => {
  describe('CreateJobAssignmentDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateJobAssignmentDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        developerId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002',
        assignmentType: 'MANUAL',
        notes: 'Test assignment'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUIDs', async () => {
      const dto = plainToClass(CreateJobAssignmentDto, {
        jobId: 'invalid-uuid',
        developerId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002',
        assignmentType: 'MANUAL'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });

    it('should fail validation with empty assignmentType', async () => {
      const dto = plainToClass(CreateJobAssignmentDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        developerId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002',
        assignmentType: ''
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('assignmentType');
    });

    it('should allow optional notes', async () => {
      const dto = plainToClass(CreateJobAssignmentDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        developerId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002',
        assignmentType: 'MANUAL'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateJobAssignmentDto', () => {
    it('should validate a valid DTO with optional fields', async () => {
      const dto = plainToClass(UpdateJobAssignmentDto, {
        notes: 'Updated notes',
        status: AssignmentStatus.IN_PROGRESS
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow empty DTO (all fields optional)', async () => {
      const dto = plainToClass(UpdateJobAssignmentDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(UpdateJobAssignmentDto, {
        status: 'INVALID_STATUS'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('ChangeStatusDto', () => {
    it('should validate a valid status', async () => {
      const dto = plainToClass(ChangeStatusDto, {
        status: AssignmentStatus.IN_PROGRESS
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(ChangeStatusDto, {
        status: 'INVALID_STATUS'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with missing status', async () => {
      const dto = plainToClass(ChangeStatusDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });



  describe('CreateTeamDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateTeamDto, {
        name: 'Team Alpha',
        description: 'A great team',
        developerIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001'
        ]
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow empty name (no IsNotEmpty decorator)', async () => {
      const dto = plainToClass(CreateTeamDto, {
        name: '',
        developerIds: ['550e8400-e29b-41d4-a716-446655440000']
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty developerIds array', async () => {
      const dto = plainToClass(CreateTeamDto, {
        name: 'Team Alpha',
        developerIds: []
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('developerIds');
    });

    it('should allow optional description', async () => {
      const dto = plainToClass(CreateTeamDto, {
        name: 'Team Alpha',
        developerIds: ['550e8400-e29b-41d4-a716-446655440000']
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('AssignTeamDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(AssignTeamDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002',
        notes: 'Team assignment'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUIDs', async () => {
      const dto = plainToClass(AssignTeamDto, {
        jobId: 'invalid-uuid',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });

    it('should allow optional notes', async () => {
      const dto = plainToClass(AssignTeamDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        assignedBy: '550e8400-e29b-41d4-a716-446655440002'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateTeamAndAssignDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateTeamAndAssignDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        team: {
          name: 'Team Alpha',
          description: 'A great team',
          developerIds: ['550e8400-e29b-41d4-a716-446655440001']
        },
        assignedBy: '550e8400-e29b-41d4-a716-446655440002',
        notes: 'Team assignment'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid jobId', async () => {
      const dto = plainToClass(CreateTeamAndAssignDto, {
        jobId: 'invalid-uuid',
        team: {
          name: 'Team Alpha',
          developerIds: ['550e8400-e29b-41d4-a716-446655440001']
        },
        assignedBy: '550e8400-e29b-41d4-a716-446655440002'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });

    it('should fail validation with invalid team data', async () => {
      const dto = plainToClass(CreateTeamAndAssignDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        team: {
          name: '',
          developerIds: []
        },
        assignedBy: '550e8400-e29b-41d4-a716-446655440002'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateTeamAssignmentStatusDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(UpdateTeamAssignmentStatusDto, {
        status: AssignmentStatus.IN_PROGRESS
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(UpdateTeamAssignmentStatusDto, {
        status: 'INVALID_STATUS'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('AssignmentStatsQueryDto', () => {
    it('should validate a valid DTO with all optional fields', async () => {
      const dto = new AssignmentStatsQueryDto();
      dto.jobId = '550e8400-e29b-41d4-a716-446655440000';
      dto.developerId = '550e8400-e29b-41d4-a716-446655440001';
      dto.dateFrom = '2024-01-01T00:00:00.000Z' as any;
      dto.dateTo = '2024-12-31T23:59:59.999Z' as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate empty DTO (all fields optional)', async () => {
      const dto = plainToClass(AssignmentStatsQueryDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid date format', async () => {
      const dto = plainToClass(AssignmentStatsQueryDto, {
        dateFrom: 'invalid-date'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dateFrom');
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToClass(AssignmentStatsQueryDto, {
        jobId: 'invalid-uuid'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });
  });

  describe('DeveloperSuggestionDto', () => {
    it('should create a valid DTO instance', () => {
      const dto = new DeveloperSuggestionDto();
      dto.id = '550e8400-e29b-41d4-a716-446655440000';
      dto.firstname = 'John';
      dto.lastname = 'Doe';
      dto.username = 'johndoe';
      dto.email = 'john.doe@example.com';
      dto.skills = ['React', 'TypeScript', 'Node.js'];

      expect(dto).toBeInstanceOf(DeveloperSuggestionDto);
      expect(dto.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(dto.firstname).toBe('John');
      expect(dto.lastname).toBe('Doe');
      expect(dto.username).toBe('johndoe');
      expect(dto.email).toBe('john.doe@example.com');
      expect(dto.skills).toEqual(['React', 'TypeScript', 'Node.js']);
    });

    it('should allow any string values (no validation decorators)', () => {
      const dto = new DeveloperSuggestionDto();
      dto.id = 'invalid-uuid';
      dto.firstname = 'John';
      dto.lastname = 'Doe';
      dto.username = 'johndoe';
      dto.email = 'invalid-email';
      dto.skills = ['React'];

      expect(dto.id).toBe('invalid-uuid');
      expect(dto.email).toBe('invalid-email');
    });

    it('should handle empty skills array', () => {
      const dto = new DeveloperSuggestionDto();
      dto.id = '550e8400-e29b-41d4-a716-446655440000';
      dto.firstname = 'John';
      dto.lastname = 'Doe';
      dto.username = 'johndoe';
      dto.email = 'john.doe@example.com';
      dto.skills = [];

      expect(dto.skills).toEqual([]);
    });
  });

  describe('ScoreJobRequestDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(ScoreJobRequestDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with default limit', async () => {
      const dto = plainToClass(ScoreJobRequestDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBe(10);
    });

    it('should fail validation with invalid UUID', async () => {
      const dto = plainToClass(ScoreJobRequestDto, {
        jobId: 'invalid-uuid',
        limit: 10
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobId');
    });

    it('should fail validation with limit too low', async () => {
      const dto = plainToClass(ScoreJobRequestDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 0
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should fail validation with limit too high', async () => {
      const dto = plainToClass(ScoreJobRequestDto, {
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 51
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });
  });

  describe('UpdateScoringConfigDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(UpdateScoringConfigDto, {
        name: 'test-config',
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: {
          requiredSkills: 0.45,
          preferredSkills: 0.15,
          performance: 0.2,
          availability: 0.1,
          workload: 0.1
        },
        constraints: {
          minExperience: 0,
          maxActiveAssignments: 5
        },
        isActive: true
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with minimal required fields', async () => {
      const dto = plainToClass(UpdateScoringConfigDto, {
        name: 'minimal-config',
        algorithm: ScoringAlgorithmType.LINEAR,
        weights: {
          requiredSkills: 0.5,
          performance: 0.5
        }
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing name', async () => {
      const dto = plainToClass(UpdateScoringConfigDto, {
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: {
          requiredSkills: 0.5,
          performance: 0.5
        }
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with invalid algorithm', async () => {
      const dto = plainToClass(UpdateScoringConfigDto, {
        name: 'test-config',
        algorithm: 'INVALID_ALGORITHM',
        weights: {
          requiredSkills: 0.5,
          performance: 0.5
        }
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('algorithm');
    });

    it('should fail validation with invalid weights object', async () => {
      const dto = plainToClass(UpdateScoringConfigDto, {
        name: 'test-config',
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: 'invalid-weights'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('weights');
    });
  });

  describe('CreateStatusHistoryDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateStatusHistoryDto, {
        previousStatus: AssignmentStatus.PENDING,
        newStatus: AssignmentStatus.IN_PROGRESS,
        reason: 'Developer started working',
        notes: 'Assignment moved to active development',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        metadata: { automationTrigger: false }
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with minimal required fields', async () => {
      const dto = plainToClass(CreateStatusHistoryDto, {
        newStatus: AssignmentStatus.COMPLETED
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing newStatus', async () => {
      const dto = plainToClass(CreateStatusHistoryDto, {
        previousStatus: AssignmentStatus.PENDING,
        reason: 'Test reason'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newStatus');
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(CreateStatusHistoryDto, {
        newStatus: 'INVALID_STATUS'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newStatus');
    });
  });

  describe('StatusHistoryQueryDto', () => {
    it('should validate a valid DTO with all fields', async () => {
      const dto = plainToClass(StatusHistoryQueryDto, {
        assignmentId: '550e8400-e29b-41d4-a716-446655440000',
        teamAssignmentId: '550e8400-e29b-41d4-a716-446655440001',
        changedBy: '550e8400-e29b-41d4-a716-446655440002',
        status: AssignmentStatus.IN_PROGRESS,
        page: 1,
        limit: 10
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate empty DTO (all fields optional)', async () => {
      const dto = plainToClass(StatusHistoryQueryDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUIDs', async () => {
      const dto = plainToClass(StatusHistoryQueryDto, {
        assignmentId: 'invalid-uuid',
        teamAssignmentId: 'invalid-uuid'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      expect(errors[0].property).toBe('assignmentId');
      expect(errors[1].property).toBe('teamAssignmentId');
    });

    it('should not validate page/limit values (no Min decorators)', async () => {
      const dto = plainToClass(StatusHistoryQueryDto, {
        page: 0,
        limit: 0
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // No Min decorators, so no validation
    });
  });


});
