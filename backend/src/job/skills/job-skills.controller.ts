import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JobSkillsService } from './job-skills.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  JobSkillRequirementDto, 
  UpdateJobSkillsDto,
  SkillLevel 
} from './dto/skill.dto';
import { AuthGuardWithRoles } from 'src/auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
@ApiTags('Job Skills')
@Controller('job-skills')
export class JobSkillsController {
  constructor(private readonly jobSkillsService: JobSkillsService) {}

  @Get('job/:jobId')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get skills for a specific job' })
  @ApiResponse({ status: 200, description: 'Job skills with details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  async getJobSkills(@Param('jobId') jobId: string) {
    return this.jobSkillsService.getJobSkills(jobId);
  }

  @Get('job/:jobId/summary')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get job skills summary' })
  @ApiResponse({ status: 200, description: 'Job skills summary with counts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  async getJobSkillsSummary(@Param('jobId') jobId: string) {
    return this.jobSkillsService.getJobSkillsSummary(jobId);
  }

  @Put('job/:jobId')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update job skills' })
  @ApiResponse({ status: 200, description: 'Job skills updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid skills data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiBody({ type: UpdateJobSkillsDto, description: 'Skills to update' })
  async updateJobSkills(
    @Param('jobId') jobId: string,
    @Body() updateSkillsDto: UpdateJobSkillsDto,
  ) {
    return this.jobSkillsService.updateJobSkills(jobId, updateSkillsDto);
  }

  @Post('job/:jobId/add')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add skills to job' })
  @ApiResponse({ status: 200, description: 'Skills added to job successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid skills data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        requiredSkills: { type: 'array', items: { $ref: '#/components/schemas/JobSkillRequirementDto' } },
        preferredSkills: { type: 'array', items: { $ref: '#/components/schemas/JobSkillRequirementDto' } }
      }
    } 
  })
  async addSkillsToJob(
    @Param('jobId') jobId: string,
    @Body() addSkillsDto: {
      requiredSkills?: JobSkillRequirementDto[];
      preferredSkills?: JobSkillRequirementDto[];
    },
  ) {
    return this.jobSkillsService.addSkillsToJob(jobId, addSkillsDto);
  }

  @Delete('job/:jobId/remove')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove skills from job' })
  @ApiResponse({ status: 200, description: 'Skills removed from job successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        requiredSkills: { type: 'array', items: { type: 'string' } },
        preferredSkills: { type: 'array', items: { type: 'string' } }
      }
    } 
  })
  async removeSkillsFromJob(
    @Param('jobId') jobId: string,
    @Body() removeSkillsDto: {
      requiredSkills?: string[];
      preferredSkills?: string[];
    },
  ) {
    return this.jobSkillsService.removeSkillsFromJob(jobId, removeSkillsDto);
  }

  @Get('skill/:skillName/jobs')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get jobs by skill requirement' })
  @ApiResponse({ status: 200, description: 'List of jobs requiring this skill' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiParam({ name: 'skillName', description: 'Skill name' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by skill level', enum: SkillLevel })
  async getJobsBySkill(
    @Param('skillName') skillName: string,
    @Query('level') level?: SkillLevel,
  ) {
    return this.jobSkillsService.getJobsBySkill(skillName, level);
  }

  @Get('statistics')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get skill statistics across all jobs' })
  @ApiResponse({ status: 200, description: 'Skill usage statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getSkillStatistics() {
    return this.jobSkillsService.getSkillStatistics();
  }

  @Post('validate-format')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate job skills format' })
  @ApiResponse({ status: 200, description: 'Skills format validation result' })
  @ApiResponse({ status: 400, description: 'Invalid skills format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        skills: { type: 'array', items: { $ref: '#/components/schemas/JobSkillRequirementDto' } }
      },
      required: ['skills']
    } 
  })
  async validateSkillsFormat(@Body() data: { skills: JobSkillRequirementDto[] }) {
    return this.jobSkillsService.validateJobSkillsFormat(data.skills);
  }
}
