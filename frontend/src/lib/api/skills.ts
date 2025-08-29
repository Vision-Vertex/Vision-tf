import { apiClient } from './client';
import {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  ExtractSkillsRequest,
  ExtractSkillsResponse,
  SkillSearchRequest,
  SkillSuggestionsRequest,
  ValidateSkillsRequest,
  ValidateSkillsResponse,
  ValidationRule,
  ApiResponse
} from '@/types/api';

// Enhanced error handling
class SkillsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SkillsApiError';
  }
}

// Skills API Client Service - Based on actual backend endpoints
export class SkillsApiService {
  private static instance: SkillsApiService;
  private baseUrl = '/v1/skills';

  private constructor() {}

  public static getInstance(): SkillsApiService {
    if (!SkillsApiService.instance) {
      SkillsApiService.instance = new SkillsApiService();
    }
    return SkillsApiService.instance;
  }

  // Enhanced error handling
  private handleError(message: string, error: any, endpoint?: string): never {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message || message;
    
    throw new SkillsApiError(errorMessage, statusCode, endpoint, error);
  }

  // Get all available skills
  async getAllSkills(): Promise<Skill[]> {
    try {
      const response = await apiClient.get<ApiResponse<Skill[]>>(this.baseUrl);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to fetch all skills', error, `${this.baseUrl} (GET)`);
    }
  }

  // Create a new skill
  async createSkill(data: CreateSkillRequest): Promise<Skill> {
    try {
      const response = await apiClient.post<ApiResponse<Skill>>(`${this.baseUrl}/create`, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to create skill', error, `${this.baseUrl}/create (POST)`);
    }
  }

  // Extract skills from job description
  async extractSkills(data: ExtractSkillsRequest): Promise<ExtractSkillsResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ExtractSkillsResponse>>(`${this.baseUrl}/extract`, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to extract skills from job description', error, `${this.baseUrl}/extract (POST)`);
    }
  }

  // Get popular skills
  async getPopularSkills(): Promise<Skill[]> {
    try {
      const response = await apiClient.get<ApiResponse<Skill[]>>(`${this.baseUrl}/popular`);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to fetch popular skills', error, `${this.baseUrl}/popular (GET)`);
    }
  }

  // Search skills by query
  async searchSkills(params: SkillSearchRequest): Promise<Skill[]> {
    try {
      const response = await apiClient.get<ApiResponse<Skill[]>>(`${this.baseUrl}/search`, { params });
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to search skills', error, `${this.baseUrl}/search (GET)`);
    }
  }

  // Get skill suggestions by project type
  async getSkillSuggestions(projectType: string, limit?: number): Promise<Skill[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<ApiResponse<Skill[]>>(`${this.baseUrl}/suggestions/${projectType}`, { params });
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to get skill suggestions for project type: ${projectType}`, error, `${this.baseUrl}/suggestions/${projectType} (GET)`);
    }
  }

  // Update an existing skill
  async updateSkill(data: UpdateSkillRequest): Promise<Skill> {
    try {
      const response = await apiClient.post<ApiResponse<Skill>>(`${this.baseUrl}/update`, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to update skill', error, `${this.baseUrl}/update (POST)`);
    }
  }

  // Validate job skills
  async validateSkills(data: ValidateSkillsRequest): Promise<ValidateSkillsResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ValidateSkillsResponse>>(`${this.baseUrl}/validate`, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to validate skills', error, `${this.baseUrl}/validate (POST)`);
    }
  }

  // Get validation rules
  async getValidationRules(): Promise<ValidationRule[]> {
    try {
      const response = await apiClient.get<ApiResponse<ValidationRule[]>>(`${this.baseUrl}/validation-rules`);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to fetch validation rules', error, `${this.baseUrl}/validation-rules (GET)`);
    }
  }
}

// Export singleton instance
export const skillsApi = SkillsApiService.getInstance();
export { SkillsApiError };
