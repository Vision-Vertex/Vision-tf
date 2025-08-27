import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  JobSearchQueryDto,
  JobSearchResponseDto,
  JobSearchResultDto,
  SearchSuggestionDto,
  SearchSuggestionsResponseDto,
} from './dto/search.dto';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Perform advanced job search with full-text search and filtering
   */
  async searchJobs(searchQuery: JobSearchQueryDto): Promise<JobSearchResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Executing job search with query: ${searchQuery.query || 'No text query'}`);

    try {
      // Build the where clause for filtering
      const whereClause = this.buildSearchWhereClause(searchQuery);
      
      // Build the orderBy clause for sorting
      const orderByClause = this.buildSearchOrderByClause(searchQuery);

      // Execute the search query
      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip: (searchQuery.page - 1) * searchQuery.limit,
          take: searchQuery.limit,
          include: {
            client: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.job.count({ where: whereClause }),
      ]);

      // Calculate relevance scores and transform results
      const results = await this.calculateRelevanceScores(jobs, searchQuery);
      
      const executionTime = Date.now() - startTime;
      const totalPages = Math.ceil(total / searchQuery.limit);

      this.logger.log(`Search completed in ${executionTime}ms. Found ${total} jobs, returning ${results.length}`);

      return {
        results,
        total,
        page: searchQuery.page,
        limit: searchQuery.limit,
        totalPages,
        query: searchQuery.query || '',
        filters: searchQuery,
        executionTime,
      };
    } catch (error) {
      this.logger.error('Error executing job search:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestionsResponseDto> {
    this.logger.log(`Getting search suggestions for query: ${query}`);

    try {
      const suggestions: SearchSuggestionDto[] = [];

      // Get skill suggestions
      const skillSuggestions = await this.getSkillSuggestions(query, limit);
      suggestions.push(...skillSuggestions);

      // Get tag suggestions
      const tagSuggestions = await this.getTagSuggestions(query, limit);
      suggestions.push(...tagSuggestions);

      // Get title suggestions
      const titleSuggestions = await this.getTitleSuggestions(query, limit);
      suggestions.push(...titleSuggestions);

      // Sort by relevance score and limit results
      const sortedSuggestions = suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        suggestions: sortedSuggestions,
        query,
        total: sortedSuggestions.length,
      };
    } catch (error) {
      this.logger.error('Error getting search suggestions:', error);
      throw error;
    }
  }

  /**
   * Get trending/popular jobs
   */
  async getTrendingJobs(limit: number = 10): Promise<JobSearchResultDto[]> {
    this.logger.log(`Getting trending jobs, limit: ${limit}`);

    try {
      // Get jobs with high priority, recent creation, and good visibility
      const trendingJobs = await this.prisma.job.findMany({
        where: {
          status: { in: [JobStatus.APPROVED, JobStatus.ASSIGNED] },
          visibility: JobVisibility.PUBLIC,
          priority: { in: [JobPriority.HIGH, JobPriority.URGENT] },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
          { deadline: 'asc' },
        ],
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      // Transform and add relevance scores
      const results = await this.calculateRelevanceScores(trendingJobs, {
        query: 'trending',
        page: 1,
        limit,
      });

      return results;
    } catch (error) {
      this.logger.error('Error getting trending jobs:', error);
      throw error;
    }
  }

  /**
   * Build the where clause for search filtering
   */
  private buildSearchWhereClause(searchQuery: JobSearchQueryDto) {
    const whereClause: any = {
      // Base filters - only show approved/assigned jobs
      status: { in: [JobStatus.APPROVED, JobStatus.ASSIGNED] },
      visibility: JobVisibility.PUBLIC,
    };

    // Text search using PostgreSQL full-text search
    if (searchQuery.query) {
      whereClause.OR = [
        {
          title: {
            search: this.buildFullTextSearchQuery(searchQuery.query),
          },
        },
        {
          description: {
            search: this.buildFullTextSearchQuery(searchQuery.query),
          },
        },
      ];
    }

    // Status filter
    if (searchQuery.status && searchQuery.status.length > 0) {
      whereClause.status = { in: searchQuery.status };
    }

    // Priority filter
    if (searchQuery.priority && searchQuery.priority.length > 0) {
      whereClause.priority = { in: searchQuery.priority };
    }

    // Project type filter
    if (searchQuery.projectType && searchQuery.projectType.length > 0) {
      whereClause.projectType = { in: searchQuery.projectType };
    }

    // Location filter
    if (searchQuery.location && searchQuery.location.length > 0) {
      whereClause.location = { in: searchQuery.location };
    }

    // Visibility filter
    if (searchQuery.visibility && searchQuery.visibility.length > 0) {
      whereClause.visibility = { in: searchQuery.visibility };
    }

    // Tags filter
    if (searchQuery.tags && searchQuery.tags.length > 0) {
      whereClause.tags = { hasSome: searchQuery.tags };
    }

    // Estimated hours filter
    if (searchQuery.minEstimatedHours || searchQuery.maxEstimatedHours) {
      whereClause.estimatedHours = {};
      if (searchQuery.minEstimatedHours) {
        whereClause.estimatedHours.gte = searchQuery.minEstimatedHours;
      }
      if (searchQuery.maxEstimatedHours) {
        whereClause.estimatedHours.lte = searchQuery.maxEstimatedHours;
      }
    }

    // Deadline filter
    if (searchQuery.deadlineBefore) {
      whereClause.deadline = {
        ...whereClause.deadline,
        lte: new Date(searchQuery.deadlineBefore),
      };
    }

    // Creation date filter
    if (searchQuery.createdAfter) {
      whereClause.createdAt = {
        gte: new Date(searchQuery.createdAfter),
      };
    }

    // Remote only filter
    if (searchQuery.remoteOnly) {
      whereClause.location = WorkLocation.REMOTE;
    }

    // Urgent only filter
    if (searchQuery.urgentOnly) {
      whereClause.priority = JobPriority.URGENT;
    }

    // Skills filter (complex JSON filtering)
    if (searchQuery.requiredSkills && searchQuery.requiredSkills.length > 0) {
      whereClause.requiredSkills = this.buildSkillsFilter(searchQuery.requiredSkills);
    }

    if (searchQuery.preferredSkills && searchQuery.preferredSkills.length > 0) {
      whereClause.preferredSkills = this.buildSkillsFilter(searchQuery.preferredSkills);
    }

    // Budget filter (complex JSON filtering)
    if (searchQuery.budget) {
      whereClause.budget = this.buildBudgetFilter(searchQuery.budget);
    }

    return whereClause;
  }

  /**
   * Build the orderBy clause for search results
   */
  private buildSearchOrderByClause(searchQuery: JobSearchQueryDto) {
    const orderBy: any[] = [];

    // Default sorting
    if (searchQuery.sortBy === 'relevance' || !searchQuery.sortBy) {
      // For relevance, we'll sort by calculated scores later
      orderBy.push({ createdAt: 'desc' });
    } else if (searchQuery.sortBy === 'deadline') {
      orderBy.push({ deadline: searchQuery.sortOrder || 'asc' });
    } else if (searchQuery.sortBy === 'budget') {
      // Budget sorting requires custom logic due to JSON structure
      orderBy.push({ createdAt: 'desc' });
    } else if (searchQuery.sortBy === 'createdAt') {
      orderBy.push({ createdAt: searchQuery.sortOrder || 'desc' });
    } else if (searchQuery.sortBy === 'priority') {
      orderBy.push({ priority: searchQuery.sortOrder || 'desc' });
    }

    // Secondary sorting
    orderBy.push({ id: 'asc' });

    return orderBy;
  }

  /**
   * Build PostgreSQL full-text search query
   */
  private buildFullTextSearchQuery(query: string): string {
    // Convert query to PostgreSQL full-text search format
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => `${word}:*`)
      .join(' & ');

    return words || query;
  }

  /**
   * Build skills filter for JSON fields
   */
  private buildSkillsFilter(skills: any[]) {
    // This is a simplified approach - in production you might want more sophisticated JSON filtering
    const conditions = skills.map(skill => ({
      path: ['skill'],
      equals: skill.skill,
    }));

    return {
      some: {
        OR: conditions,
      },
    };
  }

  /**
   * Build budget filter for JSON fields
   */
  private buildBudgetFilter(budget: any) {
    const conditions: any[] = [];

    if (budget.type) {
      conditions.push({
        path: ['type'],
        equals: budget.type,
      });
    }

    if (budget.minAmount) {
      conditions.push({
        path: ['amount'],
        gte: budget.minAmount,
      });
    }

    if (budget.maxAmount) {
      conditions.push({
        path: ['amount'],
        lte: budget.maxAmount,
      });
    }

    if (budget.currency) {
      conditions.push({
        path: ['currency'],
        equals: budget.currency,
      });
    }

    return {
      some: {
        AND: conditions,
      },
    };
  }

  /**
   * Calculate relevance scores for search results
   */
  private async calculateRelevanceScores(jobs: any[], searchQuery: JobSearchQueryDto): Promise<JobSearchResultDto[]> {
    return jobs.map(job => {
      let relevanceScore = 0.5; // Base score

      // Boost score for text query matches
      if (searchQuery.query) {
        const query = searchQuery.query.toLowerCase();
        const title = job.title.toLowerCase();
        const description = job.description.toLowerCase();

        if (title.includes(query)) {
          relevanceScore += 0.3;
        }
        if (description.includes(query)) {
          relevanceScore += 0.1;
        }
      }

      // Boost score for high priority jobs
      if (job.priority === JobPriority.URGENT) {
        relevanceScore += 0.2;
      } else if (job.priority === JobPriority.HIGH) {
        relevanceScore += 0.1;
      }

      // Boost score for recent jobs
      const daysSinceCreation = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 7) {
        relevanceScore += 0.1;
      } else if (daysSinceCreation <= 30) {
        relevanceScore += 0.05;
      }

      // Boost score for approaching deadlines
      const daysUntilDeadline = (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDeadline <= 7) {
        relevanceScore += 0.15;
      } else if (daysUntilDeadline <= 30) {
        relevanceScore += 0.1;
      }

      // Cap score at 1.0
      relevanceScore = Math.min(relevanceScore, 1.0);

      return {
        id: job.id,
        title: job.title,
        description: this.truncateDescription(job.description),
        status: job.status,
        priority: job.priority,
        projectType: job.projectType,
        location: job.location,
        requiredSkills: job.requiredSkills,
        budget: job.budget,
        deadline: job.deadline.toISOString(),
        estimatedHours: job.estimatedHours,
        tags: job.tags,
        client: job.client,
        relevanceScore: Math.round(relevanceScore * 100) / 100,
        createdAt: job.createdAt.toISOString(),
        publishedAt: job.publishedAt?.toISOString() || null,
      };
    });
  }

  /**
   * Truncate job description for search results
   */
  private truncateDescription(description: string, maxLength: number = 200): string {
    if (!description || description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
  }

  /**
   * Get skill suggestions for autocomplete
   */
  private async getSkillSuggestions(query: string, limit: number): Promise<SearchSuggestionDto[]> {
    const suggestions: SearchSuggestionDto[] = [];

    try {
      // This is a simplified approach - in production you might want to use a skills table
      const commonSkills = [
        'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
        'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Flutter', 'Angular',
        'Vue.js', 'Django', 'Flask', 'Express', 'Spring', 'Laravel', 'ASP.NET',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
        'Azure', 'GCP', 'Git', 'CI/CD', 'DevOps', 'Machine Learning', 'AI',
        'Data Science', 'Blockchain', 'Mobile Development', 'Web Development'
      ];

      const matchingSkills = commonSkills
        .filter(skill => skill.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);

      matchingSkills.forEach((skill, index) => {
        suggestions.push({
          term: skill,
          type: 'skill',
          score: 1.0 - (index * 0.1), // Higher score for first matches
        });
      });
    } catch (error) {
      this.logger.error('Error getting skill suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Get tag suggestions for autocomplete
   */
  private async getTagSuggestions(query: string, limit: number): Promise<SearchSuggestionDto[]> {
    try {
      const tags = await this.prisma.job.findMany({
        select: { tags: true },
        where: {
          tags: { hasSome: [query] },
          status: { in: [JobStatus.APPROVED, JobStatus.ASSIGNED] },
        },
        take: 100,
      });

      const tagCounts = new Map<string, number>();
      tags.forEach(job => {
        if (job.tags) {
          job.tags.forEach(tag => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          });
        }
      });

      const suggestions = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count], index) => ({
          term: tag,
          type: 'tag',
          score: Math.min(0.9, 0.5 + (count / 10) - (index * 0.05)),
        }));

      return suggestions;
    } catch (error) {
      this.logger.error('Error getting tag suggestions:', error);
      return [];
    }
  }

  /**
   * Get title suggestions for autocomplete
   */
  private async getTitleSuggestions(query: string, limit: number): Promise<SearchSuggestionDto[]> {
    try {
      const jobs = await this.prisma.job.findMany({
        select: { title: true },
        where: {
          title: { contains: query, mode: 'insensitive' },
          status: { in: [JobStatus.APPROVED, JobStatus.ASSIGNED] },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return jobs.map((job, index) => ({
        term: job.title,
        type: 'title',
        score: 0.8 - (index * 0.1),
      }));
    } catch (error) {
      this.logger.error('Error getting title suggestions:', error);
      return [];
    }
  }
}
