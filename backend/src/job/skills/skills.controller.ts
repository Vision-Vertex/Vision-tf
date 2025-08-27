import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  SkillValidationResponseDto, 
  SkillSuggestionsDto, 
  CreateJobSkillsDto,
  SkillSearchDto,
  CreateSkillDto,
  UpdateSkillDto
} from './dto/skill.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Skills Management')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available skills' })
  @ApiResponse({ status: 200, description: 'List of all available skills', type: [String] })
  async getAllSkills(): Promise<string[]> {
    return this.skillsService.getAvailableSkills();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular skills' })
  @ApiResponse({ status: 200, description: 'List of popular skills', type: [String] })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of skills to return', type: Number })
  async getPopularSkills(@Query('limit') limit: number = 10): Promise<string[]> {
    return this.skillsService.getPopularSkills(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search skills by query' })
  @ApiResponse({ status: 200, description: 'List of matching skills', type: [String] })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query', type: String })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results', type: Number })
  async searchSkills(
    @Query('q') query: string,
    @Query('limit') limit: number = 10
  ): Promise<string[]> {
    return this.skillsService.searchSkills(query, limit);
  }

  @Post('validate')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate job skills' })
  @ApiResponse({ status: 200, description: 'Skill validation result', type: SkillValidationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client or Admin role required' })
  @ApiBody({ type: CreateJobSkillsDto, description: 'Job skills to validate' })
  async validateJobSkills(
    @Body() createJobSkillsDto: CreateJobSkillsDto
  ): Promise<SkillValidationResponseDto> {
    return this.skillsService.validateJobSkills(
      createJobSkillsDto.requiredSkills,
      createJobSkillsDto.preferredSkills
    );
  }

  @Post('extract')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Extract skills from job description' })
  @ApiResponse({ status: 200, description: 'List of extracted skills', type: [String] })
  @ApiResponse({ status: 400, description: 'Invalid description' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client or Admin role required' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        description: { type: 'string', description: 'Job description text' } 
      },
      required: ['description']
    } 
  })
  async extractSkillsFromDescription(
    @Body('description') description: string
  ): Promise<string[]> {
    return this.skillsService.extractSkillsFromDescription(description);
  }

  @Get('suggestions/:projectType')
  @ApiOperation({ summary: 'Get skill suggestions by project type' })
  @ApiResponse({ status: 200, description: 'Skill suggestions for project type', type: SkillSuggestionsDto })
  @ApiResponse({ status: 400, description: 'Invalid project type' })
  @ApiParam({ name: 'projectType', description: 'Type of project', example: 'WEB_APP' })
  async getSkillSuggestionsByProjectType(
    @Param('projectType') projectType: string
  ): Promise<SkillSuggestionsDto> {
    return this.skillsService.getSkillSuggestionsByProjectType(projectType);
  }

  @Post('create')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new skill' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid skill data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client or Admin role required' })
  @ApiBody({ type: CreateSkillDto, description: 'Skill data to create' })
  async createSkill(@Body() createSkillDto: CreateSkillDto): Promise<{ message: string }> {
    const validation = this.skillsService.validateAndNormalizeSkillData(createSkillDto);
    if (!validation.isValid) {
      throw new Error(`Skill validation failed: ${validation.errors.join(', ')}`);
    }
    
    // In a real implementation, you would save to database here
    return { message: 'Skill created successfully (validation passed)' };
  }

  @Post('update')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing skill' })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid skill data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client or Admin role required' })
  @ApiBody({ type: UpdateSkillDto, description: 'Skill data to update' })
  async updateSkill(@Body() updateSkillDto: UpdateSkillDto): Promise<{ message: string }> {
    const validation = this.skillsService.validateAndNormalizeSkillData(updateSkillDto);
    if (!validation.isValid) {
      throw new Error(`Skill validation failed: ${validation.errors.join(', ')}`);
    }
    
    // In a real implementation, you would update in database here
    return { message: 'Skill updated successfully (validation passed)' };
  }

  @Get('validation-rules')
  @ApiOperation({ summary: 'Get skill validation rules' })
  @ApiResponse({ status: 200, description: 'Validation rules for skills' })
  async getValidationRules(): Promise<{
    nameRules: {
      minLength: number;
      maxLength: number;
      allowedCharacters: string;
      spamPatterns: string[];
    };
    levelRules: {
      validLevels: string[];
    };
    weightRules: {
      minValue: number;
      maxValue: number;
      precision: number;
    };
  }> {
    return {
      nameRules: {
        minLength: 2,
        maxLength: 50,
        allowedCharacters: 'Letters, numbers, spaces, hyphens, dots, plus signs',
        spamPatterns: ['spam', 'test', 'demo', 'example', 'temp', 'tmp', 'admin', 'root', 'system', 'user']
      },
      levelRules: {
        validLevels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
      },
      weightRules: {
        minValue: 0.0,
        maxValue: 1.0,
        precision: 2
      }
    };
  }
}
