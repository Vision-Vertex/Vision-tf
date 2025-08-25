import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { StatusHistoryService } from './status-history.service';
import { StatusHistoryQueryDto, StatusHistoryResponseDto } from './dto/status-history.dto';

@ApiTags('Developer and Team Assignment')
@Controller('status-history')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class StatusHistoryController {
  constructor(private readonly statusHistoryService: StatusHistoryService) {}


  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get all status history with detailed assignment information (Admin only)',
    description: `Retrieve comprehensive status history across all assignments and team assignments with filtering options.
    
    Filtering Behavior:
    - No filters: Returns all assignments with pagination
    - assignmentId filter: Returns ONLY the specific assignment matching the ID
    - teamAssignmentId filter: Returns ONLY the assignment associated with the specified team assignment
    - Both filters: assignmentId takes precedence over teamAssignmentId
    
    Returns detailed information including:
    - Assignment details (ID, job title, developer info, current status, dates)
    - Status history records (previous status → new status, timestamps, reasons)
    - Team assignments (team names, member counts, status) - included when relevant
    
    Example response structure:
    - When filtering by assignmentId: Returns only that specific assignment
    - When filtering by teamAssignmentId: Returns the assignment associated with that team
    - When no filters: Returns all assignments with pagination
    
    Note: When filtering by specific IDs, pagination is ignored and only the matching assignment is returned.`
  })
  @ApiQuery({ name: 'assignmentId', required: false, description: 'Filter by assignment ID', example: '214f698e-860f-4706-84ce-a8c9d1d6d114' })
  @ApiQuery({ name: 'teamAssignmentId', required: false, description: 'Filter by team assignment ID', example: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e' })
  @ApiQuery({ name: 'changedBy', required: false, description: 'Filter by user who made changes', example: '9b40fa98-55dd-4578-9df8-9761478730dd' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status', example: 'IN_PROGRESS' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Records per page', example: 20 })
  @ApiOkResponse({ 
    description: 'All status history retrieved successfully with detailed assignment information',
    type: StatusHistoryResponseDto
  })
  async getAllStatusHistory(@Query() query: StatusHistoryQueryDto) {
    return this.statusHistoryService.getAllStatusHistory(query);
  }

}
