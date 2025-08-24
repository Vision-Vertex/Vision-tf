import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { StatusHistoryService } from './status-history.service';
import { StatusHistoryQueryDto, StatusHistoryResponseDto } from './dto/status-history.dto';

@ApiTags('Status History & Audit Trail')
@Controller('status-history')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class StatusHistoryController {
  constructor(private readonly statusHistoryService: StatusHistoryService) {}


  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get all status history with filters (Admin only)',
    description: 'Retrieve status history across all assignments and team assignments with filtering options'
  })
  @ApiQuery({ name: 'assignmentId', required: false, description: 'Filter by assignment ID' })
  @ApiQuery({ name: 'teamAssignmentId', required: false, description: 'Filter by team assignment ID' })
  @ApiQuery({ name: 'changedBy', required: false, description: 'Filter by user who made changes' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Records per page' })
  @ApiOkResponse({ 
    description: 'All status history retrieved successfully',
    type: [StatusHistoryResponseDto]
  })
  async getAllStatusHistory(@Query() query: StatusHistoryQueryDto) {
    return this.statusHistoryService.getAllStatusHistory(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get status change statistics (Admin only)',
    description: 'Retrieve statistics about status changes across assignments and team assignments'
  })
  @ApiQuery({ name: 'assignmentId', required: false, description: 'Filter by assignment ID' })
  @ApiQuery({ name: 'teamAssignmentId', required: false, description: 'Filter by team assignment ID' })
  @ApiOkResponse({ 
    description: 'Status change statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        PENDING: { type: 'number' },
        IN_PROGRESS: { type: 'number' },
        COMPLETED: { type: 'number' },
        FAILED: { type: 'number' },
        CANCELLED: { type: 'number' }
      }
    }
  })
  async getStatusChangeStats(@Query() query: {
    assignmentId?: string;
    teamAssignmentId?: string;
  }) {
    return this.statusHistoryService.getStatusChangeStats(query);
  }


}
