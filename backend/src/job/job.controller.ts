import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JobService } from './job.service';
import { JobTransformer } from './job.transformer';
import { CreateJobDto, UpdateJobDto } from './dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse, CreatedResponse } from '../common/dto/api-response.dto';

@ApiTags('Job Management')
@Controller({ path: 'jobs' })
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobTransformer: JobTransformer,
  ) {}

  
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new job',
    description: 'Client creates a new job posting. Only clients can create jobs.',
  })
  @ApiCreatedResponse({
    description: 'Job created successfully',
    type: CreatedResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - CLIENT role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async create(@Body() createJobDto: CreateJobDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const job = await this.jobService.create(createJobDto, userId);
    const transformedJob = this.jobTransformer.transformForCreate(job);
    return new CreatedResponse('Job created successfully', transformedJob, req.route?.path);
  }

  
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all jobs',
    description: 'Retrieve a list of all jobs.',
  })
  @ApiOkResponse({
    description: 'Jobs retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async findAll(@Req() req: any) {
    const jobs = await this.jobService.findAll();
    const transformedJobs = this.jobTransformer.transformMany(jobs);
    return new SuccessResponse('Jobs retrieved successfully', transformedJobs, req.route?.path);
  }

  
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get a job by ID',
    description: 'Retrieve detailed information about a specific job.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Job found successfully',
    type: SuccessResponse,
  })
  @ApiNotFoundResponse({
    description: 'Job not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const job = await this.jobService.findOne(id);
    const transformedJob = this.jobTransformer.transform(job);
    return new SuccessResponse('Job retrieved successfully', transformedJob, req.route?.path);
  }


  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a job',
    description: 'Update job details. Only the job owner (CLIENT) or ADMIN can update.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Job updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation failed',
  })
  @ApiNotFoundResponse({
    description: 'Job not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Job owner or ADMIN role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;


    const job = await this.jobService.update(id, updateJobDto, userId);
    const transformedJob = this.jobTransformer.transformForUpdate(job);
    return new SuccessResponse('Job updated successfully', transformedJob, req.route?.path);
  }

  
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a job',
    description: 'Delete a job. Only the job owner (CLIENT) or ADMIN can delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Job deleted successfully',
    type: SuccessResponse,
  })
  @ApiNotFoundResponse({
    description: 'Job not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Job owner or ADMIN role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    
    await this.jobService.remove(id, userId);
    return new SuccessResponse('Job deleted successfully', null, req.route?.path);
  }
}
