import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  JobMatchResultDto, 
  SkillGapAnalysisDto, 
  MatchingConfigDto, 
  UpdateMatchingConfigDto,
  MatchingQueryDto
} from './dto/matching.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';

@ApiTags('Skills Matching')
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('user/:userId/job/:jobId')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Match a user to a specific job' })
  @ApiResponse({ status: 200, description: 'User-job match result', type: JobMatchResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User, job, or skills not found' })
  @ApiParam({ name: 'userId', description: 'User ID to match' })
  @ApiParam({ name: 'jobId', description: 'Job ID to match against' })
  async matchUserToJob(
    @Param('userId') userId: string,
    @Param('jobId') jobId: string,
  ): Promise<JobMatchResultDto> {
    return this.matchingService.matchUserToJob(userId, jobId);
  }

  @Get('user/:userId/job/:jobId/gap-analysis')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get skill gap analysis for a user against a job' })
  @ApiResponse({ status: 200, description: 'Skill gap analysis with recommendations', type: SkillGapAnalysisDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User or job not found' })
  @ApiParam({ name: 'userId', description: 'User ID for analysis' })
  @ApiParam({ name: 'jobId', description: 'Job ID to analyze against' })
  async getSkillGapAnalysis(
    @Param('userId') userId: string,
    @Param('jobId') jobId: string,
  ): Promise<SkillGapAnalysisDto> {
    return this.matchingService.getSkillGapAnalysis(userId, jobId);
  }

  @Get('job/:jobId/developers')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Find best matching developers for a job' })
  @ApiResponse({ status: 200, description: 'List of developer matches sorted by score', type: [JobMatchResultDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID to find matches for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of matches to return', type: Number })
  async findBestMatchesForJob(
    @Param('jobId') jobId: string,
    @Query('limit') limit: number = 10,
  ): Promise<JobMatchResultDto[]> {
    return this.matchingService.findBestMatchesForJob(jobId, limit);
  }

  @Get('user/:userId/jobs')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Find matching jobs for a user' })
  @ApiResponse({ status: 200, description: 'List of job matches sorted by score', type: [JobMatchResultDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'userId', description: 'User ID to find matches for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of matches to return', type: Number })
  async findMatchingJobsForUser(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
  ): Promise<Array<JobMatchResultDto & { job: any }>> {
    return this.matchingService.findMatchingJobsForUser(userId, limit);
  }

  @Get('job/:jobId/developers/top')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get top 3 matching developers for a job' })
  @ApiResponse({ status: 200, description: 'Top 3 developer matches', type: [JobMatchResultDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'jobId', description: 'Job ID to find top matches for' })
  async getTopMatchesForJob(@Param('jobId') jobId: string): Promise<JobMatchResultDto[]> {
    return this.matchingService.getTopMatchesForJob(jobId);
  }

  @Get('user/:userId/jobs/recommended')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get recommended jobs for a user (high priority matches)' })
  @ApiResponse({ status: 200, description: 'List of recommended jobs', type: [JobMatchResultDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'userId', description: 'User ID to get recommendations for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of recommendations', type: Number })
  async getRecommendedJobsForUser(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10,
  ): Promise<Array<JobMatchResultDto & { job: any }>> {
    return this.matchingService.getRecommendedJobsForUser(userId, limit);
  }

  @Get('config')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current matching algorithm configuration' })
  @ApiResponse({ status: 200, description: 'Current matching configuration', type: MatchingConfigDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMatchingConfig(): Promise<MatchingConfigDto> {
    return this.matchingService.getMatchingConfig();
  }

  @Put('config')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update matching algorithm configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: UpdateMatchingConfigDto, description: 'Configuration updates' })
  async updateMatchingConfig(
    @Body() updateConfigDto: UpdateMatchingConfigDto,
  ): Promise<{ message: string; config: MatchingConfigDto }> {
    this.matchingService.updateMatchingConfig(updateConfigDto);
    const updatedConfig = this.matchingService.getMatchingConfig();
    
    return {
      message: 'Matching configuration updated successfully',
      config: updatedConfig
    };
  }

  @Post('job/:jobId/developers/advanced')
  @UseGuards(AuthGuardWithRoles)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Advanced developer search with custom parameters' })
  @ApiResponse({ status: 200, description: 'Filtered developer matches', type: [JobMatchResultDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID to find matches for' })
  @ApiBody({ type: MatchingQueryDto, description: 'Advanced search parameters' })
  async advancedDeveloperSearch(
    @Param('jobId') jobId: string,
    @Body() queryDto: MatchingQueryDto,
  ): Promise<JobMatchResultDto[]> {
    const matches = await this.matchingService.findBestMatchesForJob(jobId, queryDto.limit || 10);
    
    // Apply additional filters
    let filteredMatches = matches;
    
    if (queryDto.minMatchPercentage !== undefined) {
      filteredMatches = filteredMatches.filter(match => match.overallMatch >= queryDto.minMatchPercentage!);
    }
    
    if (queryDto.highPriorityOnly) {
      filteredMatches = filteredMatches.filter(match => match.priority === 'HIGH');
    }
    
    // Sort if requested
    if (queryDto.sortByMatch) {
      filteredMatches.sort((a, b) => b.overallMatch - a.overallMatch);
    }
    
    return filteredMatches;
  }
}
