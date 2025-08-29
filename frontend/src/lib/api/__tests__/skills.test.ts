import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skillsApi, SkillsApiError } from '@/lib/api/skills';
import { apiClient } from '@/lib/api/client';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = apiClient as any;

describe('Skills API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Operations', () => {
    it('should get all skills successfully', async () => {
      const mockSkills = [
        { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'TypeScript', category: 'Frontend', level: 'ADVANCED', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockSkills, success: true },
      });

      const result = await skillsApi.getAllSkills();

      expect(result).toEqual(mockSkills);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/skills');
    });

    it('should handle get all skills error', async () => {
      const errorMessage = 'Failed to fetch skills';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.getAllSkills()).rejects.toThrow();
    });

    it('should get popular skills successfully', async () => {
      const mockSkills = [
        { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockSkills, success: true },
      });

      const result = await skillsApi.getPopularSkills();

      expect(result).toEqual(mockSkills);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/skills/popular');
    });

    it('should handle get popular skills error', async () => {
      const errorMessage = 'Failed to fetch popular skills';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.getPopularSkills()).rejects.toThrow();
    });
  });

  describe('CRUD Operations', () => {
    it('should create skill successfully', async () => {
      const createData = {
        skillName: 'Vue.js',
        category: 'Frontend',
        level: 'INTERMEDIATE',
        description: 'A progressive JavaScript framework',
      };

      const mockCreatedSkill = {
        id: 'skill-3',
        ...createData,
      };

      mockedApiClient.post.mockResolvedValue({
        data: { data: mockCreatedSkill, success: true },
      });

      const result = await skillsApi.createSkill(createData);

      expect(result).toEqual(mockCreatedSkill);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/skills/create', createData);
    });

    it('should handle create skill error', async () => {
      const createData = {};
      const errorMessage = 'Failed to create skill';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.createSkill(createData)).rejects.toThrow();
    });

    it('should update skill successfully', async () => {
      const skillId = 'skill-1';
      const updateData = {
        skillName: 'React.js',
        level: 'ADVANCED',
      };

      const mockUpdatedSkill = {
        id: 'skill-1',
        skillName: 'React.js',
        category: 'Frontend',
        level: 'ADVANCED',
        description: 'A JavaScript library for building user interfaces',
      };

      mockedApiClient.post.mockResolvedValue({
        data: { data: mockUpdatedSkill, success: true },
      });

      const result = await skillsApi.updateSkill(updateData);

      expect(result).toEqual(mockUpdatedSkill);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/skills/update', updateData);
    });

    it('should handle update skill error', async () => {
      const skillId = 'skill-1';
      const updateData = {};
      const errorMessage = 'Failed to update skill';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.updateSkill(updateData)).rejects.toThrow();
    });
  });

  describe('Search and Suggestions', () => {
    it('should search skills successfully', async () => {
      const searchParams = { query: 'React' };
      const mockSkills = [
        { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockSkills, success: true },
      });

      const result = await skillsApi.searchSkills(searchParams);

      expect(result).toEqual(mockSkills);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/skills/search', { params: searchParams });
    });

    it('should handle search skills error', async () => {
      const searchParams = { query: 'React' };
      const errorMessage = 'Failed to search skills';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.searchSkills(searchParams)).rejects.toThrow();
    });

    it('should get skill suggestions successfully', async () => {
      const projectType = 'React';
      const limit = 5;
      const mockSuggestions = [
        { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockSuggestions, success: true },
      });

      const result = await skillsApi.getSkillSuggestions(projectType, limit);

      expect(result).toEqual(mockSuggestions);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/skills/suggestions/${projectType}`, { params: { limit } });
    });

    it('should handle get skill suggestions error', async () => {
      const projectType = 'React';
      const errorMessage = 'Failed to get skill suggestions';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.getSkillSuggestions(projectType)).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate skills successfully', async () => {
      const validationData = {
        skills: ['React', 'TypeScript'],
      };

      const mockValidationResult = {
        valid: true,
        validationResults: [
          { skill: 'React', valid: true, message: 'Valid skill' },
          { skill: 'TypeScript', valid: true, message: 'Valid skill' },
        ],
      };

      mockedApiClient.post.mockResolvedValue({
        data: { data: mockValidationResult, success: true },
      });

      const result = await skillsApi.validateSkills(validationData);

      expect(result).toEqual(mockValidationResult);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/skills/validate', validationData);
    });

    it('should handle validate skills error', async () => {
      const validationData = { skills: ['InvalidSkill'] };
      const errorMessage = 'Failed to validate skills';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(skillsApi.validateSkills(validationData)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw SkillsApiError for API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid skill data' },
        },
      };

      mockedApiClient.post.mockRejectedValue(errorResponse);

      await expect(skillsApi.createSkill({})).rejects.toThrow('Invalid skill data');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockedApiClient.get.mockRejectedValue(networkError);

      await expect(skillsApi.getAllSkills()).rejects.toThrow('Network error');
    });
  });
});
