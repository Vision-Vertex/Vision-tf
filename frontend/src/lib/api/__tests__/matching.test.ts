import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchingApi, MatchingApiError } from '@/lib/api/matching';
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

describe('Matching API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should get matching config successfully', async () => {
      const mockConfig = {
        skillWeight: 0.6,
        experienceWeight: 0.3,
        locationWeight: 0.1,
        minMatchScore: 0.5,
      };

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockConfig, success: true },
      });

      const result = await matchingApi.getMatchingConfig();

      expect(result).toEqual(mockConfig);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/matching/config');
    });

    it('should handle get matching config error', async () => {
      const errorMessage = 'Failed to fetch matching configuration';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.getMatchingConfig()).rejects.toThrow();
    });

    it('should update matching config successfully', async () => {
      const updateData = {
        skillWeight: 0.7,
        experienceWeight: 0.2,
        locationWeight: 0.1,
        minMatchScore: 0.6,
      };

      const mockUpdatedConfig = {
        ...updateData,
      };

      mockedApiClient.put.mockResolvedValue({
        data: { data: mockUpdatedConfig, success: true },
      });

      const result = await matchingApi.updateMatchingConfig(updateData);

      expect(result).toEqual(mockUpdatedConfig);
      expect(mockedApiClient.put).toHaveBeenCalledWith('/v1/matching/config', updateData);
    });

    it('should handle update matching config error', async () => {
      const updateData = {};
      const errorMessage = 'Failed to update matching configuration';
      mockedApiClient.put.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.updateMatchingConfig(updateData)).rejects.toThrow();
    });
  });

  describe('Developer Matching', () => {
    it('should get developer matches successfully', async () => {
      const jobId = 'job-123';
      const mockMatches = [
        {
          developerId: 'dev-1',
          developerName: 'John Doe',
          matchScore: 0.85,
          skillMatch: 0.9,
          experienceMatch: 0.8,
          locationMatch: 0.7,
          skills: ['React', 'TypeScript'],
          experience: 5,
          location: 'New York',
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockMatches, success: true },
      });

      const result = await matchingApi.findMatchingDevelopers(jobId);

      expect(result).toEqual(mockMatches);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/matching/job/${jobId}/developers`);
    });

    it('should handle get developer matches error', async () => {
      const jobId = 'job-123';
      const errorMessage = 'Failed to fetch developer matches';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.findMatchingDevelopers(jobId)).rejects.toThrow();
    });

    it('should get top developer matches successfully', async () => {
      const jobId = 'job-123';
      const limit = 5;
      const mockTopMatches = [
        {
          developerId: 'dev-1',
          developerName: 'John Doe',
          matchScore: 0.95,
          skillMatch: 0.95,
          experienceMatch: 0.9,
          locationMatch: 0.8,
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockTopMatches, success: true },
      });

      const result = await matchingApi.getTopMatchingDevelopers(jobId);

      expect(result).toEqual(mockTopMatches);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/matching/job/${jobId}/developers/top`);
    });

    it('should handle get top developer matches error', async () => {
      const jobId = 'job-123';
      const limit = 5;
      const errorMessage = 'Failed to fetch top developer matches';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.getTopMatchingDevelopers(jobId)).rejects.toThrow();
    });
  });

  describe('Job Matching', () => {
    it('should get job matches successfully', async () => {
      const userId = 'user-123';
      const mockMatches = [
        {
          jobId: 'job-1',
          jobTitle: 'Frontend Developer',
          matchScore: 0.88,
          skillMatch: 0.92,
          experienceMatch: 0.85,
          locationMatch: 0.75,
          skills: ['React', 'TypeScript'],
          experience: 3,
          location: 'Remote',
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockMatches, success: true },
      });

      const result = await matchingApi.findMatchingJobs(userId);

      expect(result).toEqual(mockMatches);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/matching/user/${userId}/jobs`);
    });

    it('should handle get job matches error', async () => {
      const userId = 'user-123';
      const errorMessage = 'Failed to fetch job matches';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.findMatchingJobs(userId)).rejects.toThrow();
    });

    it('should get recommended jobs successfully', async () => {
      const userId = 'user-123';
      const limit = 10;
      const mockRecommendedJobs = [
        {
          jobId: 'job-1',
          jobTitle: 'Senior Frontend Developer',
          matchScore: 0.92,
          company: 'Tech Corp',
          location: 'San Francisco',
          salary: '$120k - $150k',
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockRecommendedJobs, success: true },
      });

      const result = await matchingApi.getRecommendedJobs(userId);

      expect(result).toEqual(mockRecommendedJobs);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/matching/user/${userId}/jobs/recommended`);
    });

    it('should handle get recommended jobs error', async () => {
      const userId = 'user-123';
      const limit = 10;
      const errorMessage = 'Failed to fetch recommended jobs';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.getRecommendedJobs(userId)).rejects.toThrow();
    });
  });

  describe('Advanced Search', () => {
    it('should perform advanced search successfully', async () => {
      const jobId = 'job-123';
      const searchRequest = {
        skills: ['React', 'TypeScript'],
        experience: 3,
        location: 'New York',
      };

      const mockSearchResults = [
        {
          developerId: 'dev-1',
          developerName: 'John Doe',
          matchScore: 0.85,
          skillMatch: 0.9,
          experienceMatch: 0.8,
          locationMatch: 0.7,
        },
      ];

      mockedApiClient.post.mockResolvedValue({
        data: { data: mockSearchResults, success: true },
      });

      const result = await matchingApi.advancedDeveloperSearch(jobId, searchRequest);

      expect(result).toEqual(mockSearchResults);
      expect(mockedApiClient.post).toHaveBeenCalledWith(`/v1/matching/job/${jobId}/developers/advanced`, searchRequest);
    });

    it('should handle advanced search error', async () => {
      const jobId = 'job-123';
      const searchRequest = { skills: [] };
      const errorMessage = 'Failed to perform advanced search';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.advancedDeveloperSearch(jobId, searchRequest)).rejects.toThrow();
    });
  });

  describe('Skill Gap Analysis', () => {
    it('should get skill gap analysis successfully', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';
      const mockAnalysis = {
        missingSkills: ['Docker', 'Kubernetes'],
        skillGaps: [
          {
            skillName: 'React',
            requiredLevel: 'ADVANCED',
            currentLevel: 'INTERMEDIATE',
            gap: 'INTERMEDIATE_TO_ADVANCED',
          },
        ],
        recommendations: [
          'Take advanced React course',
          'Practice with complex state management',
        ],
        overallGap: 0.25,
      };

      mockedApiClient.get.mockResolvedValue({
        data: { data: mockAnalysis, success: true },
      });

      const result = await matchingApi.getSkillGapAnalysis(userId, jobId);

      expect(result).toEqual(mockAnalysis);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/v1/matching/user/${userId}/job/${jobId}/gap-analysis`);
    });

    it('should handle skill gap analysis error', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';
      const errorMessage = 'Failed to analyze skill gap';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(matchingApi.getSkillGapAnalysis(userId, jobId)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw MatchingApiError for API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid matching parameters' },
        },
      };

      mockedApiClient.get.mockRejectedValue(errorResponse);

      await expect(matchingApi.getMatchingConfig()).rejects.toThrow('Invalid matching parameters');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockedApiClient.get.mockRejectedValue(networkError);

      await expect(matchingApi.getMatchingConfig()).rejects.toThrow('Network error');
    });
  });
});
