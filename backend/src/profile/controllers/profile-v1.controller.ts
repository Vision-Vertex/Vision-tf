import { Controller, Patch, Get, Req, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../../common/dto/api-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto/update-profile.dto';
import { UpdateDeveloperProfileDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { UpdateClientProfileDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { UpdateAdminProfileDto } from '../dto/update-admin-profile.dto/update-admin-profile.dto';
import { ProfileService } from '../profile.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';

@ApiTags('User Management - V1')

@Controller({ path: 'profile', version: '1' })
export class ProfileV1Controller {
  constructor(private readonly profileService: ProfileService) {}

  // PATCH /v1/profile (all authenticated users)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update basic profile (all roles) - V1',
    description:
      'V1: Allows any logged-in user to update their own profile. Rate limited to 15 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.userId, dto);
  }

  // PATCH /v1/profile/developer (DEVELOPER only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.DEVELOPER)
  @Patch('developer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update developer profile - V1',
    description:
      'V1: Updates developer profile information (developer role only). Rate limited to 10 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Developer profile updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or user is not a developer',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  updateDeveloperProfile(
    @Req() req: any,
    @Body() dto: UpdateDeveloperProfileDto,
  ) {
    return this.profileService.updateDeveloperProfile(req.user.userId, dto);
  }

  // PATCH /v1/profile/client (CLIENT only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.CLIENT)
  @Patch('client')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update client profile - V1',
    description:
      'V1: Updates client profile information (client role only). Rate limited to 10 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Client profile updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or user is not a client',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Client role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  updateClientProfile(@Req() req: any, @Body() dto: UpdateClientProfileDto) {
    return this.profileService.updateClientProfile(req.user.userId, dto);
  }

  // PATCH /v1/profile/admin (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update admin profile - V1',
    description:
      'V1: Updates admin profile information (admin role only). Rate limited to 5 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Admin profile updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or user is not an admin',
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
  updateAdminProfile(@Req() req: any, @Body() dto: UpdateAdminProfileDto) {
    return this.profileService.updateAdminProfile(req.user.userId, dto);
  }

  // GET /v1/profile (any authenticated user)
  @UseGuards(AuthGuardWithRoles)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Get current user's complete profile - V1",
    description:
      'V1: Retrieves the full profile details for the logged-in user.',
  })
  @ApiOkResponse({ description: 'Profile retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  getMyProfile(@Req() req: any) {
    return this.profileService.getMyProfile(req.user.userId);
  }
}
