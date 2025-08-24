import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiTooManyRequestsResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AssignmentScoringService } from './assignment-scoring.service';
import { 
  CalculateScoresDto, 
  GetRecommendationsDto, 
  DeveloperScoreDto
} from './dto/assignment-scoring.dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse, ErrorResponse } from '../common/dto/api-response.dto';

@Controller({ path: 'assignment-scoring' })
@ApiTags('Assignment Scoring')
@UseGuards(AuthGuardWithRoles)
export class AssignmentScoringController {
  constructor(private readonly assignmentScoringService: AssignmentScoringService) {}

  @Post('calculate-scores')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Calculate assignment scores for developers',
    description: 'Calculate comprehensive scores for developers based on performance history, skill matching, availability, workload balance, and priority handling for a specific job.'
  })
  @ApiCreatedResponse({
    description: 'Scores calculated successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully calculated scores for 15 developers',
        data: {
          jobId: 'job-123e4567-e89b-12d3-a456-426614174000',
          totalDevelopers: 15,
          scores: [
            {
              developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
              totalScore: 0.85,
              breakdown: {
                performanceScore: 0.85,
                skillMatchScore: 0.92,
                availabilityScore: 0.78,
                workloadScore: 0.95,
                priorityBonus: 0.88
              }
            }
          ]
        },
        path: '/assignment-scoring/calculate-scores'
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
        path: '/assignment-scoring/calculate-scores'
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
        path: '/assignment-scoring/calculate-scores'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        message: 'Insufficient permissions to calculate scores',
        error: 'FORBIDDEN',
        path: '/assignment-scoring/calculate-scores'
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
        path: '/assignment-scoring/calculate-scores'
      }
    }
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
    schema: {
      example: {
        success: false,
        message: 'Too many scoring requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        path: '/assignment-scoring/calculate-scores'
      }
    }
  })
  async calculateAssignmentScores(
    @Body() calculateScoresDto: CalculateScoresDto,
    @Req() req: any
  ) {
    try {
      const scores = await this.assignmentScoringService.calculateAssignmentScores(
        calculateScoresDto.jobId,
        calculateScoresDto.options
      );

      return new SuccessResponse(
        `Successfully calculated scores for ${scores.length} developers`,
        { jobId: calculateScoresDto.jobId, totalDevelopers: scores.length, scores },
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to calculate assignment scores: ${error.message}`,
          'SCORING_CALCULATION_ERROR',
          { jobId: calculateScoresDto.jobId },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('recommendations/:jobId')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get top developer recommendations for a job',
    description: 'Get the top developer recommendations for a specific job based on calculated scores, with optional limit and scoring options.'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID to get recommendations for',
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of top recommendations to return',
    required: false,
    type: Number,
    example: 10
  })
  @ApiOkResponse({
    description: 'Recommendations retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Successfully retrieved 10 top recommendations',
        data: {
          jobId: 'job-123e4567-e89b-12d3-a456-426614174000',
          recommendations: [
            {
              developerId: 'dev-456e7890-e89b-12d3-a456-426614174000',
              totalScore: 0.92,
              breakdown: {
                performanceScore: 0.88,
                skillMatchScore: 0.95,
                availabilityScore: 0.85,
                workloadScore: 0.90,
                priorityBonus: 0.92
              }
            }
          ],
          totalCount: 10
        },
        path: '/assignment-scoring/recommendations/job-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
    schema: {
      example: {
        success: false,
        message: 'Invalid job ID format',
        error: 'VALIDATION_ERROR',
        path: '/assignment-scoring/recommendations/job-123e4567-e89b-12d3-a456-426614174000'
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
        path: '/assignment-scoring/recommendations/job-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        message: 'Insufficient permissions to view recommendations',
        error: 'FORBIDDEN',
        path: '/assignment-scoring/recommendations/job-123e4567-e89b-12d3-a456-426614174000'
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
        path: '/assignment-scoring/recommendations/job-123e4567-e89b-12d3-a456-426614174000'
      }
    }
  })
  async getRecommendations(
    @Param('jobId') jobId: string,
    @Query('limit') limit?: number,
    @Req() req?: any
  ) {
    try {
      const recommendations = await this.assignmentScoringService.getTopRecommendations(
        jobId,
        limit || 10
      );

      return new SuccessResponse(
        `Successfully retrieved ${recommendations.length} top recommendations`,
        { 
          jobId, 
          recommendations, 
          totalCount: recommendations.length 
        },
        req.url
      );
    } catch (error) {
      throw new HttpException(
        new ErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to get recommendations: ${error.message}`,
          'RECOMMENDATIONS_ERROR',
          { jobId },
          req.url
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
