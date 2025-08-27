# Job Status & Workflow Management System

## Overview

The Job Status & Workflow Management System provides comprehensive status management for jobs with workflow transitions, status tracking, and automated status updates. It's built on top of the existing Prisma schema without requiring any database changes.

## Features

### 🎯 **Core Functionality**
- **Status Workflow Engine**: Manages job status transitions with business rules
- **Status Service Layer**: Handles all status-related business logic and database operations
- **Status Controller Layer**: REST API endpoints for status management
- **Status Automation**: Automated status updates based on conditions and schedules
- **Status History & Audit**: Complete audit trail for all status changes

### 🔄 **Status Workflow**
- **DRAFT** → **PENDING** → **APPROVED** → **ASSIGNED** → **IN_PROGRESS** → **UNDER_REVIEW** → **COMPLETED**
- **ON_HOLD** status for paused jobs
- **CANCELLED** and **EXPIRED** for terminated jobs
- Role-based access control for status transitions
- Business rule validation for each status change

### ⚡ **Automation Features**
- **Expired Job Detection**: Automatically marks jobs as expired when deadline passes
- **Assignment Status Sync**: Updates job status based on assignment statuses
- **Deadline Warnings**: Sends notifications for jobs approaching deadlines
- **Stalled Job Detection**: Identifies jobs with no activity for extended periods
- **Old Job Cleanup**: Archives completed jobs after specified time

## Architecture

### **Components**

1. **StatusWorkflowEngine** (`status-workflow.engine.ts`)
   - Defines status transition rules
   - Validates business conditions
   - Manages role-based permissions

2. **StatusService** (`status.service.ts`)
   - Core business logic for status management
   - Database operations via Prisma
   - Integration with job events and automation

3. **StatusController** (`status.controller.ts`)
   - REST API endpoints for status operations
   - Authentication and authorization
   - Request/response handling

4. **StatusAutomationService** (`status-automation.service.ts`)
   - Scheduled automation tasks
   - Event-driven automation triggers
   - System maintenance operations

### **API Endpoints**

#### Job Status Management
- `PATCH /jobs/:jobId/status` - Update job status
- `GET /jobs/:jobId/status/transitions` - Get available status transitions
- `GET /jobs/:jobId/status/history` - Get status history
- `GET /jobs/:jobId/status/workflow-config` - Get workflow configuration
- `POST /jobs/:jobId/status/bulk-update` - Bulk status updates

#### Assignment Status Management
- `PATCH /assignments/:assignmentId/status` - Update assignment status

#### Workflow Management
- `GET /status/workflow/config/:status` - Get workflow config for status
- `POST /status/workflow/validate-transition` - Validate status transition

#### Status History & Audit
- `GET /status/history` - Get global status history

## Usage Examples

### **Update Job Status**
```typescript
// Update job from PENDING to APPROVED
const result = await statusService.updateJobStatus(
  'job-123',
  {
    status: JobStatus.APPROVED,
    reason: 'Requirements met',
    notes: 'All criteria satisfied'
  },
  'user-123',
  UserRole.ADMIN
);
```

### **Get Available Transitions**
```typescript
// Get available status transitions for current user
const transitions = await statusService.getAvailableStatusTransitions(
  'job-123',
  UserRole.CLIENT
);
```

### **Bulk Status Update**
```typescript
// Update multiple jobs to APPROVED status
const result = await statusService.bulkUpdateJobStatuses(
  {
    jobIds: ['job-123', 'job-456'],
    status: JobStatus.APPROVED,
    reason: 'Bulk approval'
  },
  'user-123',
  UserRole.ADMIN
);
```

## Business Rules

### **Status Transition Rules**
- **DRAFT → PENDING**: Requires skills, budget, and deadline
- **PENDING → APPROVED**: Admin role required, approval needed
- **APPROVED → ASSIGNED**: Requires at least one assignment
- **ASSIGNED → IN_PROGRESS**: Requires active assignment
- **IN_PROGRESS → UNDER_REVIEW**: Requires deliverables
- **UNDER_REVIEW → COMPLETED**: Client approval required

### **Role Permissions**
- **CLIENT**: Can manage their own jobs (DRAFT, PENDING, UNDER_REVIEW, COMPLETED)
- **DEVELOPER**: Can update assignment statuses and progress
- **ADMIN**: Full access to all status transitions and operations

### **Automation Triggers**
- **Hourly**: Check for expired jobs
- **Every 30 minutes**: Sync assignment-based status updates
- **Daily at 9 AM**: Check approaching deadlines
- **Daily at 2 PM**: Check stalled jobs
- **Weekly**: Clean up old completed jobs

## Configuration

### **Environment Variables**
No additional environment variables required. The system uses existing database configuration.

### **Cron Schedules**
Automation tasks run on predefined schedules:
- `EVERY_HOUR` - Expired job checks
- `EVERY_30_MINUTES` - Assignment status sync
- `EVERY_DAY_AT_9AM` - Deadline warnings
- `EVERY_DAY_AT_2PM` - Stalled job detection
- `EVERY_WEEK` - Old job cleanup

## Testing

### **Unit Tests**
Comprehensive test coverage for all components:
- Status service functionality
- Workflow engine validation
- Controller endpoint handling
- Business rule validation

### **Test Commands**
```bash
# Run status service tests
npm test -- --testPathPatterns=status.service.spec.ts

# Run all status-related tests
npm test -- --testPathPatterns=status
```

## Integration

### **Existing Systems**
- **Job Management**: Integrates with existing job service
- **Event System**: Uses existing job event service
- **Authentication**: Leverages existing auth guards and decorators
- **Database**: Uses existing Prisma schema and service

### **Dependencies**
- `@nestjs/schedule` - For cron job automation
- `@nestjs/swagger` - For API documentation
- `class-validator` - For DTO validation
- `@prisma/client` - For database operations

## Monitoring & Logging

### **Logging**
- All status changes are logged with full context
- Automation tasks log their execution and results
- Error conditions are logged with stack traces

### **Audit Trail**
- Complete history of all status changes
- User tracking for all modifications
- Metadata storage for automation triggers
- IP address and user agent logging

## Future Enhancements

### **Planned Features**
- **Webhook Integration**: External system notifications
- **Advanced Automation**: Machine learning-based status predictions
- **Custom Workflows**: User-defined status transition rules
- **Real-time Updates**: WebSocket notifications for status changes
- **Advanced Analytics**: Status transition metrics and reporting

### **Scalability Considerations**
- **Queue Processing**: Background job processing for automation
- **Caching**: Redis-based caching for frequently accessed data
- **Microservices**: Potential separation into dedicated status service
- **Event Sourcing**: Full event-driven architecture for status changes

## Support & Maintenance

### **Troubleshooting**
- Check automation service logs for scheduled task issues
- Verify workflow engine configuration for transition problems
- Review business rule validation for constraint violations

### **Performance Monitoring**
- Monitor status update response times
- Track automation task execution times
- Monitor database query performance for history queries

---

*This system provides a robust foundation for job status management while maintaining compatibility with existing infrastructure and business processes.*
