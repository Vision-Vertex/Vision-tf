import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<SearchService>;

  const mockSearchService = {
    searchJobs: jest.fn(),
    getSearchSuggestions: jest.fn(),
    getTrendingJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get(SearchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchJobs', () => {
    it('should call search service and return results', async () => {
      const mockSearchQuery = {
        query: 'React developer',
        page: 1,
        limit: 20,
      };

      const mockSearchResults = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'React developer',
        filters: mockSearchQuery,
        executionTime: 10,
      };

      searchService.searchJobs.mockResolvedValue(mockSearchResults);

      const req = { route: { path: '/jobs/search' } };
      const result = await controller.searchJobs(mockSearchQuery, req);

      expect(searchService.searchJobs).toHaveBeenCalledWith(mockSearchQuery);
      expect(result.data).toEqual(mockSearchResults);
      expect(result.message).toBe('Job search completed successfully');
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return suggestions for valid query', async () => {
      const mockSuggestions = {
        suggestions: [
          { term: 'React', type: 'skill', score: 0.9 },
          { term: 'React Native', type: 'skill', score: 0.8 },
        ],
        query: 'React',
        total: 2,
      };

      searchService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const req = { route: { path: '/jobs/search/suggestions' } };
      const result = await controller.getSearchSuggestions('React', 10, req);

      expect(searchService.getSearchSuggestions).toHaveBeenCalledWith('React', 10);
      expect(result.data).toEqual(mockSuggestions);
      expect(result.message).toBe('Search suggestions retrieved successfully');
    });

    it('should handle empty query', async () => {
      const req = { route: { path: '/jobs/search/suggestions' } };
      const result = await controller.getSearchSuggestions('', 10, req);

      expect(searchService.getSearchSuggestions).not.toHaveBeenCalled();
      expect(result.data).toEqual({ suggestions: [], query: '', total: 0 });
      expect(result.message).toBe('No search query provided');
    });
  });

  describe('getTrendingJobs', () => {
    it('should return trending jobs', async () => {
      const mockTrendingJobs = [
        {
          id: 'job-1',
          title: 'Urgent React Developer',
          description: 'Urgent need for React developer',
          status: 'APPROVED',
          priority: 'URGENT',
          projectType: 'WEB_APP',
          location: 'REMOTE',
          requiredSkills: [{ skill: 'React', level: 'EXPERT', weight: 1.0 }],
          budget: { type: 'FIXED', amount: 8000, currency: 'USD' },
          deadline: '2024-12-31T00:00:00.000Z',
          estimatedHours: 100,
          tags: ['urgent', 'remote'],
          client: { id: 'client-1', firstname: 'John', lastname: 'Doe', email: 'john@example.com' },
          relevanceScore: 0.85,
          createdAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      searchService.getTrendingJobs.mockResolvedValue(mockTrendingJobs);

      const req = { route: { path: '/jobs/search/trending' } };
      const result = await controller.getTrendingJobs(10, req);

      expect(searchService.getTrendingJobs).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(mockTrendingJobs);
      expect(result.message).toBe('Trending jobs retrieved successfully');
    });
  });

  describe('quickSearch', () => {
    it('should perform quick search for valid query', async () => {
      const mockSearchResults = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'React',
        filters: {},
        executionTime: 5,
      };

      searchService.searchJobs.mockResolvedValue(mockSearchResults);

      const req = { route: { path: '/jobs/search/quick' } };
      const result = await controller.quickSearch('React', 1, 20, req);

      expect(searchService.searchJobs).toHaveBeenCalledWith({
        query: 'React',
        page: 1,
        limit: 20,
        sortBy: 'relevance',
        sortOrder: 'desc',
      });
      expect(result.data).toEqual(mockSearchResults);
      expect(result.message).toBe('Quick search completed successfully');
    });

    it('should handle empty query in quick search', async () => {
      const req = { route: { path: '/jobs/search/quick' } };
      const result = await controller.quickSearch('', 1, 20, req);

      expect(searchService.searchJobs).not.toHaveBeenCalled();
      expect(result.data.total).toBe(0);
      expect(result.message).toBe('No search query provided');
    });
  });

  describe('getSearchFilters', () => {
    it('should return available search filters', async () => {
      const req = { route: { path: '/jobs/search/filters' } };
      const result = await controller.getSearchFilters(req);

      expect(result.data).toBeDefined();
      expect(result.data.commonSkills).toBeDefined();
      expect(result.data.commonTags).toBeDefined();
      expect(result.message).toBe('Search filters retrieved successfully');
    });
  });
});
