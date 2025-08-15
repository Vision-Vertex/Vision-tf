import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SuccessResponse } from '../../common/dto/api-response.dto';
import { AdminMgmtService } from './admin-mgmt.service';
import { AdminProfileDto, ProfileFiltersDto, ProfileStatisticsDto } from '../dto/update-admin-profile.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('User Management')
@Controller('admin/profiles')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class AdminMgmtController {
  constructor(private readonly adminMgmtService: AdminMgmtService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all profiles',
    description: 'Retrieves all user profiles with advanced filtering, sorting, and pagination options. Admin role required.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for display name, email, or username' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by user role', enum: UserRole })
  @ApiQuery({ name: 'isEmailVerified', required: false, description: 'Filter by email verification status' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by account status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiOkResponse({
    description: 'Profiles retrieved successfully',
    type: SuccessResponse
  })
  @ApiBadRequestResponse({
    description: 'Invalid filter parameters'
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required'
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required'
  })
  getAllProfiles(@Query() filters: ProfileFiltersDto) {
    return this.adminMgmtService.getAllProfiles(filters);
  }



  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get profile statistics',
    description: 'Retrieves comprehensive statistics about user profiles including role distribution, registration trends, skill statistics, and geographic distribution.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    type: SuccessResponse
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required'
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required'
  })
  getProfileStatistics() {
    return this.adminMgmtService.getProfileStatistics();
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get profile analytics',
    description: 'Retrieves detailed analytics about user profiles including engagement metrics, skill distribution, availability statistics, and work preferences.',
  })
  @ApiOkResponse({
    description: 'Analytics retrieved successfully',
    type: SuccessResponse
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required'
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required'
  })
  getProfileAnalytics() {
    return this.adminMgmtService.getProfileAnalytics();
  }

  @Get(':userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get specific profile',
    description: 'Retrieves detailed information about a specific user profile by user ID.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The user ID to retrieve profile for',
    example: 'uuid-string',
    type: 'string'
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: SuccessResponse
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID'
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required'
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required'
  })
  getProfileByUserId(@Param('userId') userId: string) {
    return this.adminMgmtService.getProfileByUserId(userId);
  }
}
