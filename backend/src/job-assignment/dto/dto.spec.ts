import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateJobAssignmentDto } from './create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './update-job-assignment.dto';
import { ChangeStatusDto } from './change-status.dto';
import { BulkStatusUpdateDto } from './bulk-status-update.dto';
import { CreateTeamDto } from './create-team.dto';
import { AssignTeamDto } from './assign-team.dto';
import { CreateTeamAndAssignDto } from './create-assign-team.dto';
import { UpdateTeamAssignmentStatusDto } from './update-team-assignment.dto';
import { AssignmentStatsQueryDto } from './assignment-stats.dto';
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

  describe('BulkStatusUpdateDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(BulkStatusUpdateDto, {
        assignmentIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001'
        ],
        status: AssignmentStatus.IN_PROGRESS
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty assignmentIds array', async () => {
      const dto = plainToClass(BulkStatusUpdateDto, {
        assignmentIds: [],
        status: AssignmentStatus.IN_PROGRESS
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('assignmentIds');
    });

    it('should fail validation with invalid UUIDs in assignmentIds', async () => {
      const dto = plainToClass(BulkStatusUpdateDto, {
        assignmentIds: ['invalid-uuid'],
        status: AssignmentStatus.IN_PROGRESS
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('assignmentIds');
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


});
