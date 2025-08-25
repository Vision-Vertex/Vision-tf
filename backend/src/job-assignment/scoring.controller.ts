import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { 
  ScoreJobRequestDto, 
  ScoreJobResponseDto, 
  UpdateScoringConfigDto,
  CreateScoringConfigDto,
  ScoringConfigResponseDto,
  DeveloperPerformanceMetricDto,
  ScoringRunDto
} from './dto/scoring.dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse, ErrorResponse } from '../common/dto/api-response.dto';

@Controller({ path: 'scoring' })
@ApiTags('Developer and Team Assignment')
@UseGuards(AuthGuardWithRoles)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('score-job')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Score developers for a job',
    description: 'Calculate scores for all available developers for a specific job using the active scoring configuration.'
  })
  @ApiCreatedResponse({
    description: 'Job scored successfully',
    schema: {
      example: {
        success: true,
        message: 'Job scored successfully',
        data: {
          runId: 'run-123e4567-e89b-12d3-a456-426614174000',
          jobId: 'job-123e4567-e89b-12d3-a456-426614174000',
          items: [
            {
              developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
              totalScore: 0.85,
              rank: 1,
              breakdown: {
                requiredSkills: 0.36,
                preferredSkills: 0.12,
                performance: 0.18,
                availability: 0.08,
                workload: 0.06
              },
              developer: {
                id: 'dev-456e7890-e89b-12d3-a456-426614174000',
                firstname: 'John',
                lastname: 'Doe',
                username: 'johndoe',
                email: 'john.doe@example.com',
                skills: ['React', 'TypeScript', 'Node.js'],
                activeAssignments: 2
              }
            }
          ]
        },
        path: '/scoring/score-job'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
    schema: {
      example: {
        success: false,
        message: 'Invalid job ID provided',
        error: 'VALIDATION_ERROR',
        path: '/scoring/score-job'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized access',
        error: 'UNAUTHORIZED',
        path: '/scoring/score-job'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        message: 'Insufficient permissions to score jobs',
        error: 'FORBIDDEN',
        path: '/scoring/score-job'
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Job not found',
    schema: {
      example: {
        success: false,
        message: 'Job not found with the provided ID',
        error: 'NOT_FOUND',
        path: '/scoring/score-job'
      }
    }
  })
  async scoreJob(
    @Body() scoreJobRequestDto: ScoreJobRequestDto,
    @Req() req: any
  ) {
    try {
      const result = await this.scoringService.scoreJob(scoreJobRequestDto, req.user?.id);

      return new SuccessResponse(
        'Job scored successfully',
        result,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to score job: ${error.message}`,
          'SCORING_ERROR',
          { jobId: scoreJobRequestDto.jobId },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('configs')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new scoring configuration',
    description: 'Create a new scoring configuration with custom weights and algorithm parameters.'
  })
  @ApiCreatedResponse({
    description: 'Configuration created successfully',
    schema: {
      example: {
        success: true,
        message: 'Scoring configuration created successfully',
        data: {
          id: 'config-123e4567-e89b-12d3-a456-426614174000',
          algorithm: 'DEFAULT',
          weights: {
            requiredSkills: 0.45,
            preferredSkills: 0.15,
            performance: 0.2,
            availability: 0.1,
            workload: 0.1
          },
          isActive: true
        },
        path: '/scoring/configs'
      }
    }
  })
  async createConfig(
    @Body() createConfigDto: CreateScoringConfigDto,
    @Req() req: any
  ) {
    try {
      const config = await this.scoringService.upsertConfig(createConfigDto);

      return new SuccessResponse(
        'Scoring configuration created successfully',
        config,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to create scoring configuration: ${error.message}`,
          'CONFIGURATION_CREATION_ERROR',
          {},
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('configs')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all scoring configurations',
    description: 'Retrieve all scoring configurations with their parameters.'
  })
  @ApiOkResponse({
    description: 'Configurations retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully retrieved scoring configurations',
        data: [
          {
            id: 'config-123e4567-e89b-12d3-a456-426614174000',
            algorithm: 'DEFAULT',
            weights: {
              requiredSkills: 0.45,
              preferredSkills: 0.15,
              performance: 0.2,
              availability: 0.1,
              workload: 0.1
            },
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
          }
        ],
        path: '/scoring/configs'
      }
    }
  })
  async getConfigs(@Req() req: any) {
    try {
      const configs = await this.scoringService.getAllConfigs();

      return new SuccessResponse(
        'Successfully retrieved scoring configurations',
        configs,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to get scoring configurations: ${error.message}`,
          'CONFIGURATION_RETRIEVAL_ERROR',
          {},
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('configs/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get a specific scoring configuration',
    description: 'Retrieve a specific scoring configuration by ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'Configuration ID',
    example: 'config-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({
    description: 'Configuration retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully retrieved scoring configuration',
        data: {
          id: 'config-123e4567-e89b-12d3-a456-426614174000',
          algorithm: 'DEFAULT',
          weights: {
            requiredSkills: 0.45,
            preferredSkills: 0.15,
            performance: 0.2,
            availability: 0.1,
            workload: 0.1
          },
          isActive: true
        },
        path: '/scoring/configs/config-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  async getConfig(
    @Param('id') id: string,
    @Req() req: any
  ) {
    try {
      const config = await this.scoringService.getConfigById(id);

      if (!config) {
        throw new HttpException(
          new ErrorResponse(
            HttpStatus.NOT_FOUND,
            'Scoring configuration not found',
            'NOT_FOUND',
            { configId: id },
            req.url
          ),
          HttpStatus.NOT_FOUND
        );
      }

      return new SuccessResponse(
        'Successfully retrieved scoring configuration',
        config,
        req.url
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to get scoring configuration: ${error.message}`,
          'CONFIGURATION_RETRIEVAL_ERROR',
          { configId: id },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch('configs/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a scoring configuration',
    description: 'Update an existing scoring configuration with new parameters.'
  })
  @ApiParam({
    name: 'id',
    description: 'Configuration ID to update',
    example: 'config-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({
    description: 'Configuration updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Scoring configuration updated successfully',
        data: {
          id: 'config-123e4567-e89b-12d3-a456-426614174000',
          algorithm: 'CUSTOM',
          weights: {
            requiredSkills: 0.5,
            preferredSkills: 0.1,
            performance: 0.25,
            availability: 0.1,
            workload: 0.05
          },
          isActive: true
        },
        path: '/scoring/configs/config-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  async updateConfig(
    @Param('id') id: string,
    @Body() updateConfigDto: UpdateScoringConfigDto,
    @Req() req: any
  ) {
    try {
      const config = await this.scoringService.updateConfig(id, updateConfigDto);

      return new SuccessResponse(
        'Scoring configuration updated successfully',
        config,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to update scoring configuration: ${error.message}`,
          'CONFIGURATION_UPDATE_ERROR',
          { configId: id },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('configs/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a scoring configuration',
    description: 'Delete a scoring configuration (soft delete by setting isActive to false).'
  })
  @ApiParam({
    name: 'id',
    description: 'Configuration ID to delete',
    example: 'config-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({
    description: 'Configuration deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Scoring configuration deleted successfully',
        data: {
          id: 'config-123e4567-e89b-12d3-a456-426614174000',
          isActive: false
        },
        path: '/scoring/configs/config-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  async deleteConfig(
    @Param('id') id: string,
    @Req() req: any
  ) {
    try {
      const result = await this.scoringService.deleteConfig(id);

      return new SuccessResponse(
        'Scoring configuration deleted successfully',
        result,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to delete scoring configuration: ${error.message}`,
          'CONFIGURATION_DELETION_ERROR',
          { configId: id },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('performance/:developerId')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update developer performance metrics',
    description: 'Calculate and update performance metrics for a specific developer.'
  })
  @ApiParam({
    name: 'developerId',
    description: 'Developer ID to update performance for',
    example: 'dev-456e7890-e89b-12d3-a456-426614174000'
  })
  @ApiCreatedResponse({
    description: 'Performance metrics updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Developer performance metrics updated successfully',
        data: {
          developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
          completedCount: 25,
          failedCount: 2,
          cancelledCount: 1,
          onTimeRate: 0.92,
          avgCycleTimeHours: 45.5,
          avgQualityRating: 4.2
        },
        path: '/scoring/performance/dev-456e7890-e89b-12d3-a456-426614174000'
      }
    }
  })
  async updateDeveloperPerformance(
    @Param('developerId') developerId: string,
    @Req() req: any
  ) {
    try {
      const metrics = await this.scoringService.updateDeveloperPerformance(developerId);

      return new SuccessResponse(
        'Developer performance metrics updated successfully',
        metrics,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to update developer performance: ${error.message}`,
          'PERFORMANCE_UPDATE_ERROR',
          { developerId },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance/:developerId')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get developer performance metrics',
    description: 'Retrieve performance metrics for a specific developer.'
  })
  @ApiParam({
    name: 'developerId',
    description: 'Developer ID to get performance for',
    example: 'dev-456e7890-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({
    description: 'Performance metrics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully retrieved developer performance metrics',
        data: {
          developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
          completedCount: 25,
          failedCount: 2,
          cancelledCount: 1,
          onTimeRate: 0.92,
          avgCycleTimeHours: 45.5,
          avgQualityRating: 4.2,
          lastUpdatedAt: '2024-01-15T10:30:00.000Z'
        },
        path: '/scoring/performance/dev-456e7890-e89b-12d3-a456-426614174000'
      }
    }
  })
  async getDeveloperPerformance(
    @Param('developerId') developerId: string,
    @Req() req: any
  ) {
    try {
      const metrics = await this.scoringService.getDeveloperPerformance(developerId);

      if (!metrics) {
        throw new HttpException(
          new ErrorResponse(
            HttpStatus.NOT_FOUND,
            'Developer performance metrics not found',
            'NOT_FOUND',
            { developerId },
            req.url
          ),
          HttpStatus.NOT_FOUND
        );
      }

      return new SuccessResponse(
        'Successfully retrieved developer performance metrics',
        metrics,
        req.url
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to get developer performance: ${error.message}`,
          'PERFORMANCE_RETRIEVAL_ERROR',
          { developerId },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('runs')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get scoring run history',
    description: 'Retrieve scoring run history with optional job filtering.'
  })
  @ApiQuery({
    name: 'jobId',
    description: 'Filter by job ID',
    required: false,
    type: String,
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of runs to return',
    required: false,
    type: Number,
    example: 10
  })
  @ApiOkResponse({
    description: 'Scoring runs retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully retrieved scoring runs',
        data: [
          {
            id: 'run-123e4567-e89b-12d3-a456-426614174000',
            jobId: 'job-123e4567-e89b-12d3-a456-426614174000',
            algorithm: 'DEFAULT',
            createdAt: '2024-01-15T10:30:00.000Z',
            scores: [
              {
                developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
                totalScore: 0.85,
                rank: 1,
                developer: {
                  id: 'dev-456e7890-e89b-12d3-a456-426614174000',
                  firstname: 'John',
                  lastname: 'Doe',
                  username: 'johndoe',
                  email: 'john.doe@example.com'
                }
              }
            ]
          }
        ],
        path: '/scoring/runs'
      }
    }
  })
  async getScoringRuns(
    @Query('jobId') jobId?: string,
    @Query('limit') limit?: number,
    @Req() req?: any
  ) {
    try {
      const runs = await this.scoringService.getScoringRuns(jobId, limit || 10);

      return new SuccessResponse(
        'Successfully retrieved scoring runs',
        runs,
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to get scoring runs: ${error.message}`,
          'RUNS_RETRIEVAL_ERROR',
          {},
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('runs/:runId')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get specific scoring run details',
    description: 'Retrieve detailed information about a specific scoring run.'
  })
  @ApiParam({
    name: 'runId',
    description: 'Scoring run ID',
    example: 'run-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({
    description: 'Scoring run details retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully retrieved scoring run details',
        data: {
          id: 'run-123e4567-e89b-12d3-a456-426614174000',
          jobId: 'job-123e4567-e89b-12d3-a456-426614174000',
          algorithm: 'DEFAULT',
          createdAt: '2024-01-15T10:30:00.000Z',
          config: {
            id: 'config-123e4567-e89b-12d3-a456-426614174000',
            algorithm: 'DEFAULT',
            weights: {
              requiredSkills: 0.45,
              preferredSkills: 0.15,
              performance: 0.2,
              availability: 0.1,
              workload: 0.1
            }
          },
          scores: [
            {
              developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
              totalScore: 0.85,
              rank: 1,
              breakdown: {
                requiredSkills: 0.36,
                preferredSkills: 0.12,
                performance: 0.18,
                availability: 0.08,
                workload: 0.06
              },
              developer: {
                id: 'dev-456e7890-e89b-12d3-a456-426614174000',
                firstname: 'John',
                lastname: 'Doe',
                username: 'johndoe',
                email: 'john.doe@example.com'
              }
            }
          ]
        },
        path: '/scoring/runs/run-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  async getScoringRun(
    @Param('runId') runId: string,
    @Req() req: any
  ) {
    try {
      const run = await this.scoringService.getScoringRunById(runId);

      if (!run) {
        throw new HttpException(
          new ErrorResponse(
            HttpStatus.NOT_FOUND,
            'Scoring run not found',
            'NOT_FOUND',
            { runId },
            req.url
          ),
          HttpStatus.NOT_FOUND
        );
      }

      return new SuccessResponse(
        'Successfully retrieved scoring run details',
        run,
        req.url
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to get scoring run: ${error.message}`,
          'RUN_RETRIEVAL_ERROR',
          { runId },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
