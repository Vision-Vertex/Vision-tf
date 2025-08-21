import { Controller, Patch, Get, Req, Body, UseGuards, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../common/dto/api-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto/update-developer-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto/update-client-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto/update-admin-profile.dto';
import { ProfileService } from './profile.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import {
  ProfileCompletionDto,
  ProfileValidationDto,
  ProfileRequiredFieldsDto,
} from './dto/profile-completion.dto/profile-completion.dto';

@ApiTags('User Profiles')
@Controller({ path: 'profile' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // PATCH /profile (all authenticated users)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update basic profile (all roles)',
    description:
      'Allows any logged-in user to update their own profile. Rate limited to 15 requests per minute.',
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

  // PATCH /profile/developer (DEVELOPER only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.DEVELOPER)
  @Patch('developer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update developer profile',
    description:
      'Updates developer profile information (developer role only). Rate limited to 10 requests per minute.',
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

  // PATCH /profile/client (CLIENT only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.CLIENT)
  @Patch('client')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update client profile',
    description:
      'Updates client profile information (client role only). Rate limited to 10 requests per minute.',
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

  // PATCH /profile/admin (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update admin profile',
    description:
      'Updates admin profile information (admin role only). Rate limited to 10 requests per minute.',
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

  // POST /profile/picture/upload (all authenticated users)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Post('picture/upload')
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload profile picture',
    description:
      'Uploads a profile picture image. Supports JPG, PNG, WebP formats. Max size: 5MB. Rate limited to 5 uploads per minute.',
  })
  @ApiOkResponse({
    description: 'Profile picture uploaded successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format or size',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many uploads',
  })
  uploadProfilePicture(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePicture(req.user.userId, file);
  }

  // GET /profile (any authenticated user)
  @UseGuards(AuthGuardWithRoles)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Get current user's complete profile",
    description: 'Retrieves the full profile details for the logged-in user.',
  })
  @ApiOkResponse({ description: 'Profile retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  getMyProfile(@Req() req: any) {
    return this.profileService.getMyProfile(req.user.userId);
  }

  // GET /profile/developer/completion (DEVELOPER only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.DEVELOPER)
  @Get('developer/completion')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get developer profile completion',
    description:
      'Retrieves detailed profile completion breakdown for the current developer. Rate limited to 30 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile completion retrieved successfully',
    type: ProfileCompletionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getDeveloperProfileCompletion(@Req() req: any) {
    return this.profileService.getProfileCompletion(req.user.userId);
  }

  // GET /profile/developer/validation (DEVELOPER only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.DEVELOPER)
  @Get('developer/validation')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validate developer profile',
    description:
      'Validates all profile fields and returns detailed validation results. Rate limited to 20 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile validation completed successfully',
    type: ProfileValidationDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  validateDeveloperProfile(@Req() req: any) {
    return this.profileService.validateProfile(req.user.userId);
  }

  // GET /profile/developer/required-fields (DEVELOPER only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.DEVELOPER)
  @Get('developer/required-fields')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get developer required fields',
    description:
      'Retrieves list of required fields for developer profiles with completion status. Rate limited to 30 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Required fields retrieved successfully',
    type: ProfileRequiredFieldsDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getDeveloperRequiredFields(@Req() req: any) {
    return this.profileService.getRequiredFields(req.user.userId);
  }

  // GET /profile/client/completion (CLIENT only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.CLIENT)
  @Get('client/completion')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get client profile completion',
    description:
      'Retrieves detailed profile completion breakdown for the current client. Rate limited to 30 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile completion retrieved successfully',
    type: ProfileCompletionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Client role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getClientProfileCompletion(@Req() req: any) {
    return this.profileService.getProfileCompletion(req.user.userId);
  }

  // GET /profile/client/validation (CLIENT only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.CLIENT)
  @Get('client/validation')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validate client profile',
    description:
      'Validates all profile fields and returns detailed validation results. Rate limited to 20 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile validation completed successfully',
    type: ProfileValidationDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Client role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  validateClientProfile(@Req() req: any) {
    return this.profileService.validateProfile(req.user.userId);
  }

  // GET /profile/client/required-fields (CLIENT only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.CLIENT)
  @Get('client/required-fields')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get client required fields',
    description:
      'Retrieves list of required fields for client profiles with completion status. Rate limited to 30 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Required fields retrieved successfully',
    type: ProfileRequiredFieldsDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Client role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getClientRequiredFields(@Req() req: any) {
    return this.profileService.getRequiredFields(req.user.userId);
  }

  // GET /profile/admin/completion (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/completion')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get admin profile completion',
    description:
      'Retrieves detailed profile completion breakdown for the current admin. Rate limited to 30 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile completion retrieved successfully',
    type: ProfileCompletionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getAdminProfileCompletion(@Req() req: any) {
    return this.profileService.getProfileCompletion(req.user.userId);
  }

  // GET /profile/admin/validation (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/validation')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validate admin profile',
    description:
      'Validates all profile fields and returns detailed validation results. Rate limited to 20 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Profile validation completed successfully',
    type: ProfileValidationDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  validateAdminProfile(@Req() req: any) {
    return this.profileService.validateProfile(req.user.userId);
  }

  // GET /profile/admin/required-fields (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/required-fields')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get admin required fields',
    description:
      'Retrieves list of required fields for admin profiles with completion status. Rate limited to 30 requests per minute.',
  })
  @ApiOkResponse({
    description: 'Required fields retrieved successfully',
    type: ProfileRequiredFieldsDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  getAdminRequiredFields(@Req() req: any) {
    return this.profileService.getRequiredFields(req.user.userId);
  }
}
