import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobSkillsApi, JobSkillsApiError } from '@/lib/api/job-skills';
import { apiClient } from '@/lib/api/client';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = apiClient as any;

describe('Job Skills API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Operations', () => {
    it('should get job skills successfully', async () => {
      const jobId = 'job-123';
      const mockJobSkills = [
        {
          id: 'skill-1',
          jobId: 'job-123',
          skillName: 'React',
          skillLevel: 'INTERMEDIATE',
          importance: 1,
        },
        {
          id: 'skill-2',
          jobId: 'job-123',
          skillName: 'TypeScript',
          skillLevel: 'ADVANCED',
          importance: 2,
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockJobSkills, success: true },
      });

      const result = await jobSkillsApi.getJobSkills(jobId);

      expect(result).toEqual(mockJobSkills);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/job-skills/job/${jobId}`);
    });

    it('should handle get job skills error', async () => {
      const jobId = 'job-123';
      const errorMessage = 'Failed to fetch job skills';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.getJobSkills(jobId)).rejects.toThrow();
    });

    it('should add job skills successfully', async () => {
      const jobId = 'job-123';
      const addData = {
        skills: [
          { skillName: 'React', skillLevel: 'INTERMEDIATE', importance: 1 },
          { skillName: 'TypeScript', skillLevel: 'ADVANCED', importance: 2 },
        ],
      };

      const mockAddedSkills = [
        {
          id: 'skill-1',
          jobId: 'job-123',
          skillName: 'React',
          skillLevel: 'INTERMEDIATE',
          importance: 1,
        },
        {
          id: 'skill-2',
          jobId: 'job-123',
          skillName: 'TypeScript',
          skillLevel: 'ADVANCED',
          importance: 2,
        },
      ];

      mockedApiClient.post.mockResolvedValue({
        data: { data: mockAddedSkills, success: true },
      });

      const result = await jobSkillsApi.addJobSkills(jobId, addData);

      expect(result).toEqual(mockAddedSkills);
      expect(mockedApiClient.post).toHaveBeenCalledWith(`/v1/job-skills/job/${jobId}/add`, addData);
    });

    it('should handle add job skills error', async () => {
      const jobId = 'job-123';
      const addData = { skills: [] };
      const errorMessage = 'Failed to add job skills';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.addJobSkills(jobId, addData)).rejects.toThrow();
    });

    it('should update job skills successfully', async () => {
      const jobId = 'job-123';
      const updateData = {
        skills: [
          { id: 'skill-1', skillName: 'React', skillLevel: 'ADVANCED', importance: 1 },
        ],
      };

      const mockUpdatedSkills = [
        {
          id: 'skill-1',
          jobId: 'job-123',
          skillName: 'React',
          skillLevel: 'ADVANCED',
          importance: 1,
        },
      ];

      mockedApiClient.put.mockResolvedValue({
        data: { data: mockUpdatedSkills, success: true },
      });

      const result = await jobSkillsApi.updateJobSkills(jobId, updateData);

      expect(result).toEqual(mockUpdatedSkills);
      expect(mockedApiClient.put).toHaveBeenCalledWith(`/v1/job-skills/job/${jobId}`, updateData);
    });

    it('should handle update job skills error', async () => {
      const jobId = 'job-123';
      const updateData = { skills: [] };
      const errorMessage = 'Failed to update job skills';
      mockedApiClient.put.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.updateJobSkills(jobId, updateData)).rejects.toThrow();
    });

    it('should remove job skills successfully', async () => {
      const jobId = 'job-123';
      const removeData = { skillIds: ['skill-1', 'skill-2'] };

      mockedApiClient.delete.mockResolvedValue({
        data: { data: { success: true }, success: true },
      });

      await jobSkillsApi.removeJobSkills(jobId, removeData);

      expect(mockedApiClient.delete).toHaveBeenCalledWith(`/v1/job-skills/job/${jobId}/remove`, {
        data: removeData,
      });
    });

    it('should handle remove job skills error', async () => {
      const jobId = 'job-123';
      const removeData = { skillIds: ['skill-1'] };
      const errorMessage = 'Failed to remove job skills';
      mockedApiClient.delete.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.removeJobSkills(jobId, removeData)).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate job skills format successfully', async () => {
      const validationData = {
        skills: [
          { skillName: 'React', skillLevel: 'INTERMEDIATE', importance: 1 },
        ],
      };

      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      mockedApiClient.post.mockResolvedValue({
        data: { data: mockValidationResult, success: true },
      });

      const result = await jobSkillsApi.validateJobSkillsFormat(validationData);

      expect(result).toEqual(mockValidationResult);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/job-skills/validate-format', validationData);
    });

    it('should handle validation error', async () => {
      const validationData = { skills: [] };
      const errorMessage = 'Failed to validate job skills format';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.validateJobSkillsFormat(validationData)).rejects.toThrow();
    });
  });

  describe('Analysis', () => {
    it('should get job skills summary successfully', async () => {
      const jobId = 'job-123';
      const mockSummary = {
        totalSkills: 5,
        skillCategories: {
          'Frontend': 3,
          'Backend': 2,
        },
        averageImportance: 2.4,
        skillLevels: {
          'BEGINNER': 1,
          'INTERMEDIATE': 2,
          'ADVANCED': 2,
        },
      };

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockSummary, success: true },
      });

      const result = await jobSkillsApi.getJobSkillsSummary(jobId);

      expect(result).toEqual(mockSummary);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/job-skills/job/${jobId}/summary`);
    });

    it('should handle get job skills summary error', async () => {
      const jobId = 'job-123';
      const errorMessage = 'Failed to fetch job skills summary';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.getJobSkillsSummary(jobId)).rejects.toThrow();
    });

    it('should get skill statistics successfully', async () => {
      const mockStatistics = [
        {
          skillName: 'React',
          totalJobs: 150,
          averageImportance: 2.3,
          mostCommonLevel: 'INTERMEDIATE',
        },
        {
          skillName: 'TypeScript',
          totalJobs: 120,
          averageImportance: 2.1,
          mostCommonLevel: 'ADVANCED',
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockStatistics, success: true },
      });

      const result = await jobSkillsApi.getSkillStatistics();

      expect(result).toEqual(mockStatistics);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/job-skills/statistics');
    });

    it('should handle get skill statistics error', async () => {
      const errorMessage = 'Failed to fetch skill statistics';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(jobSkillsApi.getSkillStatistics()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw JobSkillsApiError for API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid skill data' },
        },
      };

      mockedApiClient.post.mockRejectedValue(errorResponse);

      await expect(jobSkillsApi.addJobSkills('job-123', { skills: [] })).rejects.toThrow('Invalid skill data');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockedApiClient.get.mockRejectedValue(networkError);

      await expect(jobSkillsApi.getJobSkills('job-123')).rejects.toThrow('Network error');
    });
  });
});
