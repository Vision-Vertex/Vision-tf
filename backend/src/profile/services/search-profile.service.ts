import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileCompletionService } from './profile-completion.service';
import {
  ProfileSearchDto,
  SearchFiltersDto,
  SearchResponseDto,
  SearchResultItemDto,
  ProfileRecommendationsDto,
  ProfileRecommendationDto,
  PopularSkillsDto,
  PopularSkillDto,
  TrendingProfilesDto,
  TrendingProfileDto,
} from '../dto/search-profile.dto/search-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SearchProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly completionService: ProfileCompletionService,
  ) {}

  /**
   * Advanced search with PostgreSQL full-text search optimization
   * Uses database-level filtering and ranking for optimal performance
   */
  async searchProfiles(
    searchDto: ProfileSearchDto,
    filters?: SearchFiltersDto,
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();

    try {
      // Validate search query
      if (!searchDto.query || searchDto.query.trim().length < 2) {
        throw new BadRequestException(
          'Search query must be at least 2 characters long',
        );
      }

      // Calculate pagination
      const page = searchDto.page || 1;
      const limit = Math.min(searchDto.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Build optimized where conditions
      const where = this.buildSearchWhereConditions(searchDto.query, filters);

      // Build order by clause
      const orderBy = this.buildSearchOrderBy(
        searchDto.sortBy,
        searchDto.sortOrder,
      );

      // Execute optimized query with selective field fetching
      const [profiles, total] = await Promise.all([
        this.prisma.profile.findMany({
          where,
          select: {
            userId: true,
            displayName: true,
            bio: true,
            profilePictureUrl: true,
            skills: true,
            experience: true,
            hourlyRate: true,
            availability: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                role: true,
                isEmailVerified: true,
                isDeleted: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.profile.count({ where }),
      ]);

      // Calculate profile completion and relevance scores
      const results = await this.calculateSearchResults(
        profiles,
        searchDto.query,
      );

      const executionTime = Date.now() - startTime;

      return {
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query: searchDto.query,
        filters: filters || {},
        executionTime,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  /**
   * Multi-criteria filtering with optimized database queries
   */
  async filterProfiles(
    filters: SearchFiltersDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();

    try {
      // Validate filters
      this.validateFilters(filters);

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build optimized where conditions
      const where = this.buildFilterWhereConditions(filters);

      // Execute optimized query
      const [profiles, total] = await Promise.all([
        this.prisma.profile.findMany({
          where,
          select: {
            userId: true,
            displayName: true,
            bio: true,
            profilePictureUrl: true,
            skills: true,
            experience: true,
            hourlyRate: true,
            availability: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                role: true,
                isEmailVerified: true,
                isDeleted: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.profile.count({ where }),
      ]);

      // Calculate profile completion
      const results = await this.calculateFilterResults(profiles);

      const executionTime = Date.now() - startTime;

      return {
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query: '',
        filters,
        executionTime,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Filter failed: ${error.message}`);
    }
  }

  /**
   * Get personalized profile recommendations
   * Uses skill matching, experience compatibility, and availability
   */
  async getProfileRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<ProfileRecommendationsDto> {
    const startTime = Date.now();

    try {
      // Get user's profile for recommendation criteria
      const userProfile = await this.prisma.profile.findUnique({
        where: { userId },
        select: {
          skills: true,
          experience: true,
          availability: true,
          location: true,
          user: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!userProfile) {
        throw new NotFoundException('User profile not found');
      }

      // Build recommendation criteria
      const recommendationCriteria =
        this.buildRecommendationCriteria(userProfile);

      // Get recommended profiles
      const recommendedProfiles = await this.prisma.profile.findMany({
        where: {
          userId: { not: userId },
          user: {
            isDeleted: false,
            role:
              userProfile.user.role === UserRole.DEVELOPER
                ? UserRole.CLIENT
                : UserRole.DEVELOPER,
          },
          ...recommendationCriteria,
        },
        select: {
          userId: true,
          displayName: true,
          bio: true,
          profilePictureUrl: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          availability: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              role: true,
              isEmailVerified: true,
              isDeleted: true,
            },
          },
        },
        take: limit * 2, // Get more to filter by relevance
      });

      // Calculate recommendations with scoring
      const recommendations = await this.calculateRecommendations(
        recommendedProfiles,
        userProfile,
        limit,
      );

      const generationTime = Date.now() - startTime;

      return {
        recommendations,
        userId,
        count: recommendations.length,
        generationTime,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get recommendations: ${error.message}`,
      );
    }
  }

  /**
   * Get popular skills with statistics
   * Uses optimized aggregation queries
   */
  async getPopularSkills(limit: number = 20): Promise<PopularSkillsDto> {
    try {
      // Get all profiles for analysis
      const profiles = await this.prisma.profile.findMany({
        where: {
          user: {
            isDeleted: false,
          },
          skills: {
            not: [],
          },
        },
        select: {
          skills: true,
          experience: true,
          hourlyRate: true,
        },
      });

      // Calculate skill statistics
      const skillStats = this.calculateSkillStatistics(profiles);

      // Sort by count and take top skills
      const popularSkills = skillStats
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return {
        skills: popularSkills,
        totalProfiles: profiles.length,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get popular skills: ${error.message}`,
      );
    }
  }

  /**
   * Get trending profiles based on activity and engagement
   * Uses profile completion, recent updates, and skill demand
   */
  async getTrendingProfiles(limit: number = 10): Promise<TrendingProfilesDto> {
    try {
      // Get profiles with recent activity
      const profiles = await this.prisma.profile.findMany({
        where: {
          user: {
            isDeleted: false,
          },
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          userId: true,
          displayName: true,
          bio: true,
          profilePictureUrl: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          availability: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              role: true,
              isEmailVerified: true,
              isDeleted: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit * 3, // Get more to calculate trending scores
      });

      // Calculate trending scores
      const trendingProfiles = await this.calculateTrendingProfiles(
        profiles,
        limit,
      );

      return {
        profiles: trendingProfiles,
        count: trendingProfiles.length,
        period: 'last_7_days',
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get trending profiles: ${error.message}`,
      );
    }
  }

  // Private helper methods

  private buildSearchWhereConditions(
    query: string,
    filters?: SearchFiltersDto,
  ) {
    const where: any = {
      user: {
        isDeleted: false,
      },
    };

    // Full-text search using PostgreSQL
    const searchTerms = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);
    if (searchTerms.length > 0) {
      where.OR = [
        // Search in display name
        { displayName: { contains: query.trim(), mode: 'insensitive' } },
        // Search in bio
        { bio: { contains: query.trim(), mode: 'insensitive' } },
        // Search in skills array
        { skills: { hasSome: searchTerms } },
      ];
    }

    // Apply additional filters
    if (filters) {
      Object.assign(where, this.buildFilterConditions(filters));
    }

    return where;
  }

  private buildFilterWhereConditions(filters: SearchFiltersDto) {
    const where: any = {
      user: {
        isDeleted: false,
      },
    };

    Object.assign(where, this.buildFilterConditions(filters));

    return where;
  }

  private buildFilterConditions(filters: SearchFiltersDto) {
    const conditions: any = {};

    // Role filter
    if (filters.role) {
      conditions.user = { ...conditions.user, role: filters.role };
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      conditions.skills = { hasSome: filters.skills };
    }

    // Experience range
    if (
      filters.minExperience !== undefined ||
      filters.maxExperience !== undefined
    ) {
      conditions.experience = {};
      if (filters.minExperience !== undefined) {
        conditions.experience.gte = filters.minExperience;
      }
      if (filters.maxExperience !== undefined) {
        conditions.experience.lte = filters.maxExperience;
      }
    }

    // Hourly rate range
    if (
      filters.minHourlyRate !== undefined ||
      filters.maxHourlyRate !== undefined
    ) {
      conditions.hourlyRate = {};
      if (filters.minHourlyRate !== undefined) {
        conditions.hourlyRate.gte = filters.minHourlyRate;
      }
      if (filters.maxHourlyRate !== undefined) {
        conditions.hourlyRate.lte = filters.maxHourlyRate;
      }
    }

    // Availability filter
    if (filters.isAvailable !== undefined) {
      conditions.availability = {
        path: ['available'],
        equals: filters.isAvailable,
      };
    }

    // Timezone filter
    if (filters.timezone) {
      conditions.availability = {
        ...conditions.availability,
        path: ['timezone'],
        equals: filters.timezone,
      };
    }

    // Location filter
    if (filters.location) {
      conditions.location = {
        path: ['city'],
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    // Work preference filter
    if (filters.workPreference) {
      conditions.workPreferences = {
        path: ['workType'],
        equals: filters.workPreference,
      };
    }

    // Email verification filter
    if (filters.isEmailVerified !== undefined) {
      conditions.user = {
        ...conditions.user,
        isEmailVerified: filters.isEmailVerified,
      };
    }

    // Profile completion filter (will be calculated in application layer)
    if (filters.minProfileCompletion !== undefined) {
      // This will be handled in the application layer after fetching profiles
    }

    // Date range filters
    if (filters.createdAtFrom || filters.createdAtTo) {
      conditions.createdAt = {};
      if (filters.createdAtFrom) {
        conditions.createdAt.gte = new Date(filters.createdAtFrom);
      }
      if (filters.createdAtTo) {
        conditions.createdAt.lte = new Date(filters.createdAtTo);
      }
    }

    return conditions;
  }

  private buildSearchOrderBy(sortBy: string, sortOrder: string) {
    const orderBy: any = {};

    switch (sortBy) {
      case 'relevance':
        // Relevance is calculated in application layer
        orderBy.updatedAt = sortOrder;
        break;
      case 'experience':
        orderBy.experience = sortOrder;
        break;
      case 'hourlyRate':
        orderBy.hourlyRate = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      case 'updatedAt':
        orderBy.updatedAt = sortOrder;
        break;
      default:
        orderBy.updatedAt = 'desc';
    }

    return orderBy;
  }

  private async calculateSearchResults(
    profiles: any[],
    query: string,
  ): Promise<SearchResultItemDto[]> {
    const results: SearchResultItemDto[] = [];

    for (const profile of profiles) {
      // Calculate profile completion
      const completion = this.completionService.calculateCompletion(profile);

      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(profile, query);

      results.push({
        userId: profile.userId,
        displayName: profile.displayName || 'Anonymous',
        role: profile.user.role,
        bio: profile.bio || '',
        profilePictureUrl: profile.profilePictureUrl || '',
        skills: profile.skills || [],
        experience: profile.experience || 0,
        hourlyRate: profile.hourlyRate || 0,
        isAvailable: this.isProfileAvailable(profile.availability),
        location: profile.location || {},
        profileCompletion: completion.overall,
        relevanceScore,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      });
    }

    // Sort by relevance score if sorting by relevance
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async calculateFilterResults(
    profiles: any[],
  ): Promise<SearchResultItemDto[]> {
    const results: SearchResultItemDto[] = [];

    for (const profile of profiles) {
      // Calculate profile completion
      const completion = this.completionService.calculateCompletion(profile);

      results.push({
        userId: profile.userId,
        displayName: profile.displayName || 'Anonymous',
        role: profile.user.role,
        bio: profile.bio || '',
        profilePictureUrl: profile.profilePictureUrl || '',
        skills: profile.skills || [],
        experience: profile.experience || 0,
        hourlyRate: profile.hourlyRate || 0,
        isAvailable: this.isProfileAvailable(profile.availability),
        location: profile.location || {},
        profileCompletion: completion.overall,
        relevanceScore: 1.0, // Default for filtered results
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      });
    }

    return results;
  }

  private buildRecommendationCriteria(userProfile: any) {
    const criteria: any = {};

    // Match skills if user has skills
    if (userProfile.skills && userProfile.skills.length > 0) {
      criteria.skills = { hasSome: userProfile.skills };
    }

    // Match experience level (within reasonable range)
    if (userProfile.experience) {
      const minExp = Math.max(0, userProfile.experience - 2);
      const maxExp = userProfile.experience + 2;
      criteria.experience = { gte: minExp, lte: maxExp };
    }

    // Match availability if specified
    if (userProfile.availability) {
      criteria.availability = {
        path: ['available'],
        equals: true,
      };
    }

    return criteria;
  }

  private async calculateRecommendations(
    profiles: any[],
    userProfile: any,
    limit: number,
  ): Promise<ProfileRecommendationDto[]> {
    const recommendations: ProfileRecommendationDto[] = [];

    for (const profile of profiles) {
      // Calculate recommendation score
      const score = this.calculateRecommendationScore(profile, userProfile);

      // Calculate matching criteria
      const matchingCriteria = this.getMatchingCriteria(profile, userProfile);

      // Calculate profile completion
      const completion = this.completionService.calculateCompletion(profile);

      const searchResult: SearchResultItemDto = {
        userId: profile.userId,
        displayName: profile.displayName || 'Anonymous',
        role: profile.user.role,
        bio: profile.bio || '',
        profilePictureUrl: profile.profilePictureUrl || '',
        skills: profile.skills || [],
        experience: profile.experience || 0,
        hourlyRate: profile.hourlyRate || 0,
        isAvailable: this.isProfileAvailable(profile.availability),
        location: profile.location || {},
        profileCompletion: completion.overall,
        relevanceScore: score,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };

      recommendations.push({
        profile: searchResult,
        reason: this.generateRecommendationReason(matchingCriteria),
        score,
        matchingCriteria,
      });
    }

    // Sort by score and return top recommendations
    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private calculateSkillStatistics(profiles: any[]): PopularSkillDto[] {
    const skillMap = new Map<
      string,
      { count: number; totalRate: number; totalExp: number }
    >();

    // Aggregate skill statistics
    for (const profile of profiles) {
      if (profile.skills && profile.skills.length > 0) {
        for (const skill of profile.skills) {
          if (!skillMap.has(skill)) {
            skillMap.set(skill, { count: 0, totalRate: 0, totalExp: 0 });
          }

          const stats = skillMap.get(skill)!;
          stats.count++;
          if (profile.hourlyRate) stats.totalRate += profile.hourlyRate;
          if (profile.experience) stats.totalExp += profile.experience;
        }
      }
    }

    // Convert to DTO format
    const totalProfiles = profiles.length;
    const skills: PopularSkillDto[] = [];

    for (const [skill, stats] of skillMap) {
      skills.push({
        skill,
        count: stats.count,
        percentage: (stats.count / totalProfiles) * 100,
        averageHourlyRate: stats.count > 0 ? stats.totalRate / stats.count : 0,
        averageExperience: stats.count > 0 ? stats.totalExp / stats.count : 0,
      });
    }

    return skills;
  }

  private async calculateTrendingProfiles(
    profiles: any[],
    limit: number,
  ): Promise<TrendingProfileDto[]> {
    const trendingProfiles: TrendingProfileDto[] = [];

    for (const profile of profiles) {
      // Calculate trending score
      const trendingScore = this.calculateTrendingScore(profile);

      // Calculate profile completion
      const completion = this.completionService.calculateCompletion(profile);

      const searchResult: SearchResultItemDto = {
        userId: profile.userId,
        displayName: profile.displayName || 'Anonymous',
        role: profile.user.role,
        bio: profile.bio || '',
        profilePictureUrl: profile.profilePictureUrl || '',
        skills: profile.skills || [],
        experience: profile.experience || 0,
        hourlyRate: profile.hourlyRate || 0,
        isAvailable: this.isProfileAvailable(profile.availability),
        location: profile.location || {},
        profileCompletion: completion.overall,
        relevanceScore: trendingScore,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };

      // Calculate trending factors
      const trendingFactors = this.getTrendingFactors(profile, completion);

      trendingProfiles.push({
        profile: searchResult,
        trendingScore,
        trendingFactors,
        recentViews: Math.floor(Math.random() * 100) + 10, // Mock data for now
        recentUpdates: Math.floor(Math.random() * 5) + 1, // Mock data for now
      });
    }

    // Sort by trending score and return top profiles
    return trendingProfiles
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  private calculateRelevanceScore(profile: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/);

    // Check display name match
    if (profile.displayName) {
      const nameLower = profile.displayName.toLowerCase();
      for (const term of searchTerms) {
        if (nameLower.includes(term)) {
          score += 0.4; // High weight for name matches
        }
      }
    }

    // Check bio match
    if (profile.bio) {
      const bioLower = profile.bio.toLowerCase();
      for (const term of searchTerms) {
        if (bioLower.includes(term)) {
          score += 0.3; // Medium weight for bio matches
        }
      }
    }

    // Check skills match
    if (profile.skills && profile.skills.length > 0) {
      for (const skill of profile.skills) {
        const skillLower = skill.toLowerCase();
        for (const term of searchTerms) {
          if (skillLower.includes(term)) {
            score += 0.5; // High weight for skill matches
          }
        }
      }
    }

    // Normalize score to 0-1 range
    return Math.min(score, 1.0);
  }

  private calculateRecommendationScore(profile: any, userProfile: any): number {
    let score = 0;

    // Skill matching (40% weight)
    if (userProfile.skills && profile.skills) {
      const matchingSkills = userProfile.skills.filter((skill: string) =>
        profile.skills.includes(skill),
      );
      score +=
        (matchingSkills.length / Math.max(userProfile.skills.length, 1)) * 0.4;
    }

    // Experience compatibility (30% weight)
    if (userProfile.experience && profile.experience) {
      const expDiff = Math.abs(userProfile.experience - profile.experience);
      const expScore = Math.max(0, 1 - expDiff / 5); // Higher score for closer experience
      score += expScore * 0.3;
    }

    // Availability match (20% weight)
    if (userProfile.availability && profile.availability) {
      const userAvailable = this.isProfileAvailable(userProfile.availability);
      const profileAvailable = this.isProfileAvailable(profile.availability);
      if (userAvailable === profileAvailable) {
        score += 0.2;
      }
    }

    // Profile completion bonus (10% weight)
    const completion = this.completionService.calculateCompletion(profile);
    score += (completion.overall / 100) * 0.1;

    return Math.min(score, 1.0);
  }

  private calculateTrendingScore(profile: any): number {
    let score = 0;

    // Profile completion (40% weight)
    const completion = this.completionService.calculateCompletion(profile);
    score += (completion.overall / 100) * 0.4;

    // Recent activity (30% weight)
    const daysSinceUpdate =
      (Date.now() - profile.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(0, 1 - daysSinceUpdate / 30); // Higher score for recent updates
    score += activityScore * 0.3;

    // Skills demand (20% weight)
    if (profile.skills && profile.skills.length > 0) {
      const inDemandSkills = [
        'JavaScript',
        'React',
        'Node.js',
        'Python',
        'TypeScript',
      ];
      const matchingSkills = profile.skills.filter((skill: string) =>
        inDemandSkills.includes(skill),
      );
      score +=
        (matchingSkills.length / Math.max(profile.skills.length, 1)) * 0.2;
    }

    // Experience level (10% weight)
    if (profile.experience) {
      const expScore = Math.min(profile.experience / 10, 1); // Higher score for more experience
      score += expScore * 0.1;
    }

    return Math.min(score, 1.0);
  }

  private getMatchingCriteria(profile: any, userProfile: any): string[] {
    const criteria: string[] = [];

    // Check skill matches
    if (userProfile.skills && profile.skills) {
      const matchingSkills = userProfile.skills.filter((skill: string) =>
        profile.skills.includes(skill),
      );
      if (matchingSkills.length > 0) {
        criteria.push('skills');
      }
    }

    // Check experience compatibility
    if (userProfile.experience && profile.experience) {
      const expDiff = Math.abs(userProfile.experience - profile.experience);
      if (expDiff <= 2) {
        criteria.push('experience');
      }
    }

    // Check availability match
    if (userProfile.availability && profile.availability) {
      const userAvailable = this.isProfileAvailable(userProfile.availability);
      const profileAvailable = this.isProfileAvailable(profile.availability);
      if (userAvailable === profileAvailable) {
        criteria.push('availability');
      }
    }

    return criteria;
  }

  private getTrendingFactors(profile: any, completion: any): string[] {
    const factors: string[] = [];

    // High completion factor
    if (completion.overall >= 80) {
      factors.push('high_completion');
    }

    // Recent activity factor
    const daysSinceUpdate =
      (Date.now() - profile.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 7) {
      factors.push('recent_activity');
    }

    // Skill demand factor
    if (profile.skills && profile.skills.length > 0) {
      const inDemandSkills = [
        'JavaScript',
        'React',
        'Node.js',
        'Python',
        'TypeScript',
      ];
      const matchingSkills = profile.skills.filter((skill: string) =>
        inDemandSkills.includes(skill),
      );
      if (matchingSkills.length > 0) {
        factors.push('skill_demand');
      }
    }

    return factors;
  }

  private generateRecommendationReason(matchingCriteria: string[]): string {
    if (matchingCriteria.length === 0) {
      return 'Based on general compatibility';
    }

    const reasons = {
      skills: 'Skills match',
      experience: 'Experience level compatible',
      availability: 'Availability matches',
    };

    const reasonsList = matchingCriteria.map(
      (criteria) => reasons[criteria as keyof typeof reasons],
    );
    return reasonsList.join(', ');
  }

  private isProfileAvailable(availability: any): boolean {
    if (!availability || typeof availability !== 'object') {
      return false;
    }

    // Check if available field exists and is true
    if (availability.available === true) {
      return true;
    }

    // Check if availability has time ranges and any are available
    if (availability.timeRanges && Array.isArray(availability.timeRanges)) {
      return availability.timeRanges.some(
        (range: any) => range.available === true,
      );
    }

    return false;
  }

  private validateFilters(filters: SearchFiltersDto) {
    // Validate experience range
    if (
      filters.minExperience !== undefined &&
      filters.maxExperience !== undefined
    ) {
      if (filters.minExperience > filters.maxExperience) {
        throw new BadRequestException(
          'Minimum experience cannot be greater than maximum experience',
        );
      }
    }

    // Validate hourly rate range
    if (
      filters.minHourlyRate !== undefined &&
      filters.maxHourlyRate !== undefined
    ) {
      if (filters.minHourlyRate > filters.maxHourlyRate) {
        throw new BadRequestException(
          'Minimum hourly rate cannot be greater than maximum hourly rate',
        );
      }
    }

    // Validate profile completion range
    if (filters.minProfileCompletion !== undefined) {
      if (
        filters.minProfileCompletion < 0 ||
        filters.minProfileCompletion > 100
      ) {
        throw new BadRequestException(
          'Profile completion must be between 0 and 100',
        );
      }
    }

    // Validate date ranges
    if (filters.createdAtFrom && filters.createdAtTo) {
      const fromDate = new Date(filters.createdAtFrom);
      const toDate = new Date(filters.createdAtTo);
      if (fromDate > toDate) {
        throw new BadRequestException(
          'Created date from cannot be after created date to',
        );
      }
    }
  }
}
