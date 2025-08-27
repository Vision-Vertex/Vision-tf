import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';

describe('SearchService', () => {
  let service: SearchService;
  let prismaService: any;

  const mockPrismaService = {
    job: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchJobs', () => {
    it('should perform basic search without filters', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'React Developer',
          description: 'We need a React developer',
          status: JobStatus.APPROVED,
          priority: JobPriority.HIGH,
          projectType: ProjectType.WEB_APP,
          location: WorkLocation.REMOTE,
          requiredSkills: [{ skill: 'React', level: 'EXPERT', weight: 1.0 }],
          budget: { type: 'FIXED', amount: 5000, currency: 'USD' },
          deadline: new Date('2024-12-31'),
          estimatedHours: 80,
          tags: ['urgent', 'remote'],
          client: { id: 'client-1', firstname: 'John', lastname: 'Doe', email: 'john@example.com' },
          createdAt: new Date('2024-01-01'),
          publishedAt: new Date('2024-01-01'),
        },
      ];

      prismaService.job.findMany.mockResolvedValue(mockJobs);
      prismaService.job.count.mockResolvedValue(1);

      const searchQuery = {
        query: 'React developer',
        page: 1,
        limit: 20,
      };

      const result = await service.searchJobs(searchQuery);

      expect(result.total).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('React Developer');
      expect(result.results[0].relevanceScore).toBeGreaterThan(0);
    });

    it('should handle search with filters', async () => {
      const mockJobs = [];
      prismaService.job.findMany.mockResolvedValue(mockJobs);
      prismaService.job.count.mockResolvedValue(0);

      const searchQuery = {
        status: [JobStatus.APPROVED],
        priority: [JobPriority.HIGH],
        location: [WorkLocation.REMOTE],
        page: 1,
        limit: 20,
      };

      const result = await service.searchJobs(searchQuery);

      expect(result.total).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return skill suggestions', async () => {
      const result = await service.getSearchSuggestions('React', 5);

      expect(result.suggestions).toBeDefined();
      expect(result.query).toBe('React');
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('getTrendingJobs', () => {
    it('should return trending jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Urgent React Developer',
          description: 'Urgent need for React developer',
          status: JobStatus.APPROVED,
          priority: JobPriority.URGENT,
          projectType: ProjectType.WEB_APP,
          location: WorkLocation.REMOTE,
          requiredSkills: [{ skill: 'React', level: 'EXPERT', weight: 1.0 }],
          budget: { type: 'FIXED', amount: 8000, currency: 'USD' },
          deadline: new Date('2024-12-31'),
          estimatedHours: 100,
          tags: ['urgent', 'remote'],
          client: { id: 'client-1', firstname: 'John', lastname: 'Doe', email: 'john@example.com' },
          createdAt: new Date('2024-01-01'),
          publishedAt: new Date('2024-01-01'),
        },
      ];

      prismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await service.getTrendingJobs(5);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Urgent React Developer');
    });
  });
});
