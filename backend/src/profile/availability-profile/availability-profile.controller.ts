import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { SuccessResponse } from '../../common/dto/api-response.dto';
import { AvailabilityProfileService } from './availability-profile.service';
import { AvailabilityDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { WorkPreferencesDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';

import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('User Management')
@Controller('profile/developer/availability')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class AvailabilityProfileController {
  constructor(private service: AvailabilityProfileService) {}

  @Patch('availability')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Update developer availability',
    description: 'Updates the availability settings for the authenticated developer. Includes work hours, timezone, notice period, and project preferences.',
  })
  @ApiOkResponse({ 
    description: 'Availability updated successfully', 
    type: SuccessResponse 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid data or profile not found' 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Developer role required' 
  })
  updateAvailability(@Req() req: any, @Body() dto: AvailabilityDto) {
    return this.service.updateAvailability(req.user.userId, dto);
  }

  @Patch('work-preferences')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Update developer work preferences',
    description: 'Updates the work preferences for the authenticated developer. Includes remote work options, travel willingness, contract types, and project duration preferences.',
  })
  @ApiOkResponse({ 
    description: 'Work preferences updated successfully', 
    type: SuccessResponse 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid data or profile not found' 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Developer role required' 
  })
  updateWorkPreferences(@Req() req: any, @Body() dto: WorkPreferencesDto) {
    return this.service.updateWorkPreferences(req.user.userId, dto);
  }

  @Get('availability')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Get developer availability',
    description: 'Retrieves the current availability settings for the authenticated developer.',
  })
  @ApiOkResponse({ 
    description: 'Availability retrieved successfully', 
    type: SuccessResponse 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid request data' 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Developer role required' 
  })
  getAvailability(@Req() req: any) {
    return this.service.getAvailability(req.user.userId);
  }

  @Get('work-preferences')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Get developer work preferences',
    description: 'Retrieves the current work preferences for the authenticated developer.',
  })
  @ApiOkResponse({ 
    description: 'Work preferences retrieved successfully', 
    type: SuccessResponse 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid request data' 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Developer role required' 
  })
  getWorkPreferences(@Req() req: any) {
    return this.service.getWorkPreferences(req.user.userId);
  }
}
