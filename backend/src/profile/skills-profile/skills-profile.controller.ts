import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
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
} from '@nestjs/swagger';
import { SuccessResponse } from '../../common/dto/api-response.dto';
import { SkillsProfileService } from './skills-profile.service';
import {
  AddSkillDto,
  UpdateSkillsDto,
  SkillSuggestionDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('User Management')
@Controller('profile/developer/skills')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class SkillsProfileController {
  constructor(private skillsService: SkillsProfileService) {}

  @Get()
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Get developer skills',
    description: 'Retrieves all skills for the authenticated developer.',
  })
  @ApiOkResponse({
    description: 'Skills retrieved successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  getSkills(@Req() req: any) {
    return this.skillsService.getSkills(req.user.userId);
  }

  @Post('add')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Add developer skill',
    description:
      "Adds a single skill to the developer's profile. Skill must not already exist.",
  })
  @ApiOkResponse({
    description: 'Skill added successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Skill already exists, invalid data, or profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  addSkill(@Req() req: any, @Body() dto: AddSkillDto) {
    return this.skillsService.addSkill(req.user.userId, dto);
  }

  @Delete(':skill')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Remove developer skill',
    description:
      "Removes a specific skill from the developer's profile. If skill does not exist, operation completes successfully.",
  })
  @ApiParam({
    name: 'skill',
    description:
      'The skill name to remove (URL encoded if contains special characters)',
    example: 'JavaScript',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Skill removed successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid skill parameter or profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  removeSkill(@Req() req: any, @Param('skill') skill: string) {
    return this.skillsService.removeSkill(req.user.userId, skill);
  }

  @Put()
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Update skills array (bulk update)',
    description:
      'Updates the entire skills array for the developer. Replaces existing skills with the new array.',
  })
  @ApiOkResponse({
    description: 'Skills updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid skills data or profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  updateSkills(@Req() req: any, @Body() dto: UpdateSkillsDto) {
    return this.skillsService.updateSkills(req.user.userId, dto);
  }

  @Get('suggestions')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({
    summary: 'Get skill suggestions',
    description:
      'Returns skill suggestions based on current skills and popular skills in the database.',
  })
  @ApiOkResponse({
    description: 'Skill suggestions retrieved successfully',
    type: SkillSuggestionDto,
  })
  @ApiBadRequestResponse({
    description: 'Profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  getSkillSuggestions(@Req() req: any) {
    return this.skillsService.suggestSkills(req.user.userId);
  }
}
