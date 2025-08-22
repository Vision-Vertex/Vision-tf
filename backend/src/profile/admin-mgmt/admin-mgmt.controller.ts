import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiQuery,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { SuccessResponse } from '../../common/dto/api-response.dto';
import { AdminMgmtService } from './admin-mgmt.service';
import {
  AdminProfileDto,
  ProfileFiltersDto,
  ProfileStatisticsDto,
} from '../dto/update-admin-profile.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import {
  ProfileCompletionDto,
  CompletionStatsDto,
} from '../dto/profile-completion.dto/profile-completion.dto';
import { AdminUpdateDto } from '../dto/admin-update.dto/admin-update.dto';

@ApiTags('Admin Operations')
@Controller('admin/profiles')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class AdminMgmtController {
  constructor(private readonly adminMgmtService: AdminMgmtService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all profiles',
    description:
      'Retrieves all user profiles with advanced filtering, sorting, and pagination options. Admin role required. Rate limited to 30 requests per minute.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for display name, email, or username',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by user role',
    enum: UserRole,
  })
  @ApiQuery({
    name: 'isEmailVerified',
    required: false,
    description: 'Filter by email verification status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by account status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Profiles retrieved successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid filter parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getAllProfiles(@Query() filters: ProfileFiltersDto, @Req() req: any) {
    return this.adminMgmtService.getAllProfiles(filters, req.user?.id);
  }

  @Get('statistics')
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get profile statistics',
    description:
      'Retrieves basic statistics about user profiles including role distribution. Rate limited to 10 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getProfileStatistics(@Req() req: any) {
    return this.adminMgmtService.getProfileStatistics(req.user?.id);
  }

  @Get('analytics')
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get profile analytics',
    description:
      'Retrieves basic analytics about user profiles. Rate limited to 10 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Analytics retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getProfileAnalytics(@Req() req: any) {
    return this.adminMgmtService.getProfileAnalytics(req.user?.id);
  }

  @Get(':userId')
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get specific profile',
    description:
      'Retrieves detailed information about a specific user profile by user ID. Rate limited to 60 requests per minute.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The user ID to retrieve profile for',
    example: 'uuid-string',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getProfileByUserId(@Param('userId') userId: string, @Req() req: any) {
    return this.adminMgmtService.getProfileByUserId(userId, req.user?.id);
  }

  @Put(':userId')
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update profile by admin',
    description:
      'Allows admins to update any user profile. Rate limited to 20 requests per minute.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The user ID to update profile for',
    example: 'uuid-string',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid profile data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  updateProfileByAdmin(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateDto,
    @Req() req: any,
  ) {
    return this.adminMgmtService.updateProfileByAdmin(
      userId,
      dto,
      req.user?.id,
    );
  }

  @Get(':userId/completion')
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get detailed profile completion',
    description:
      'Retrieves detailed profile completion breakdown for a specific user. Rate limited to 60 requests per minute.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The user ID to get completion for',
    example: 'uuid-string',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Profile completion retrieved successfully',
    type: ProfileCompletionDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getProfileCompletion(@Param('userId') userId: string, @Req() req: any) {
    return this.adminMgmtService.getProfileCompletion(userId, req.user?.id);
  }

  @Get('completion/stats')
  @UseGuards(RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get profile completion statistics',
    description:
      'Retrieves completion statistics across all profiles. Rate limited to 10 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Completion statistics retrieved successfully',
    type: CompletionStatsDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getCompletionStats(@Req() req: any) {
    return this.adminMgmtService.getCompletionStats(req.user?.id);
  }
}
