import {
  Controller,
  Patch,
  Get,
  Req,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../common/dto/api-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto/update-developer-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto/update-client-profile.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto/update-admin-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('User Management')
@Controller({ path: 'profile' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // PATCH /profile (all authenticated users)
  @UseGuards(AuthGuardWithRoles)
  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update basic profile (all roles)',
    description: 'Allows any logged-in user to update their own profile.',
  })
  @ApiOkResponse({ 
    description: 'Profile updated successfully', 
    type: SuccessResponse 
})
  @ApiBadRequestResponse({ 
    description: 'Invalid data' 
})
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
})
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.userId, dto);
  }

  // PATCH /profile/developer (DEVELOPER only)
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.DEVELOPER)
  @Patch('developer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update developer profile',
    description: 'Updates developer profile information (developer role only).',
  })
  @ApiOkResponse({ 
    description: 'Developer profile updated successfully', 
    type: SuccessResponse 
})
  @ApiBadRequestResponse({ 
    description: 'Invalid data or user is not a developer' 
})
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
})
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Developer role required' 
})
  updateDeveloperProfile(@Req() req: any, @Body() dto: UpdateDeveloperProfileDto) {
    return this.profileService.updateDeveloperProfile(req.user.userId, dto);
  }
  

  // PATCH /profile/client (CLIENT only)
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT)
  @Patch('client')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update client profile',
    description: 'Updates client profile information (client role only).',
  })
  @ApiOkResponse({ 
    description: 'Client profile updated successfully', 
    type: SuccessResponse 
})
  @ApiBadRequestResponse({ 
    description: 'Invalid data or user is not a client' 
})
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
})
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Client role required' 
})
  updateClientProfile(@Req() req: any, @Body() dto: UpdateClientProfileDto) {
    return this.profileService.updateClientProfile(req.user.userId, dto);
  }

  // PATCH /profile/admin (ADMIN only)
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Patch('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update admin profile',
    description: 'Updates admin profile information (admin role only).',
  })
  @ApiOkResponse({ 
    description: 'Admin profile updated successfully',
    type: SuccessResponse 
})
  @ApiBadRequestResponse({ 
    description: 'Invalid data or user is not an admin'
 })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
})
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Admin role required' 
})
  updateAdminProfile(@Req() req: any, @Body() dto: UpdateAdminProfileDto) {
    return this.profileService.updateAdminProfile(req.user.userId, dto);
  }

  // GET /profile (any authenticated user)
  @UseGuards(AuthGuardWithRoles)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user’s complete profile',
    description: 'Retrieves the full profile details for the logged-in user.',
  })
  @ApiOkResponse({ description: 'Profile retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  getMyProfile(@Req() req: any) {
    return this.profileService.getMyProfile(req.user.userId);
  }
}
