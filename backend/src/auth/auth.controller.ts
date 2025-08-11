import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  Query,
  Put,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { TerminateSessionsDto } from './dto/terminate-sessions.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { SuspiciousActivityQueryDto } from './dto/suspicious-activity-query.dto';
import { UpdateSuspiciousActivityDto } from './dto/update-suspicious-activity.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuardWithRoles } from './guards/auth.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  SuccessResponse,
  CreatedResponse,
  AuthResponse,
  TwoFactorSetupResponse,
  UserProfile,
  SessionInfo,
  AuditLogEntry,
  SuspiciousActivity,
  LoginPattern,
} from '../common/dto/api-response.dto';

@ApiTags('Authentication & Authorization')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 signups per 5 minutes
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with email verification. The user will receive a verification email.',
  })
  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: CreatedResponse,
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message:
          'User registered successfully. Please check your email to verify your account.',
        data: {
          id: 'e33eab6b-e559-417d-aa99-d606cb7b9ed4',
          email: 'john.doe@example.com',
          username: 'johndoe123',
          isEmailVerified: false,
        },
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/auth/signup',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or email/username already taken',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Email or username already taken',
        errorCode: 'VALIDATION_ERROR',
        details: null,
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/auth/signup',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email or username already exists',
  })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 login attempts per 5 minutes
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates a user and returns JWT tokens. If 2FA is enabled, returns a 2FA requirement response.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    type: SuccessResponse,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Authentication successful',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'abc123def456...',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user: {
            id: 'e33eab6b-e559-417d-aa99-d606cb7b9ed4',
            email: 'john.doe@example.com',
            username: 'johndoe123',
            role: 'CLIENT',
            isEmailVerified: true,
          },
          session: {
            sessionToken: 'session-token-123',
            deviceName: 'Chrome on Windows',
            expiresAt: '2025-08-07T09:25:00.000Z',
          },
        },
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/auth/login',
      },
    },
  })
  @ApiOkResponse({
    description: '2FA required',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Two-factor authentication required',
        data: {
          requires2FA: true,
          message: 'Two-factor authentication required',
        },
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/auth/login',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiForbiddenResponse({
    description: 'Account locked due to failed attempts',
  })
  login(@Body() dto: LoginDto, @Req() req: any) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.login(dto, userAgent, ipAddress);
  }

  @Post('verify-2fa')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 2FA attempts per 5 minutes
  @ApiOperation({
    summary: 'Verify 2FA code',
    description:
      'Verifies 2FA code and completes login process. Accepts TOTP codes or backup codes.',
  })
  @ApiBody({ type: Verify2faDto })
  @ApiOkResponse({
    description: '2FA verification successful',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid 2FA code or credentials',
  })
  verify2fa(@Body() dto: Verify2faDto, @Req() req: any) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.verify2fa(dto, ipAddress, userAgent);
  }

  @Post('verify-email')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 email verification attempts per 5 minutes
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies user email address using the token sent via email.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification token',
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('forgot-password')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 password reset requests per 10 minutes
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset email to the provided email address.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Password reset email sent (if email exists)',
    type: SuccessResponse,
  })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: any) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.forgotPassword(dto, ipAddress, userAgent);
  }

  @Post('reset-password')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 password reset attempts per 5 minutes
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the token received via email.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Password reset successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token',
  })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.resetPassword(dto, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Get('setup-2fa')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Setup 2FA',
    description:
      'Initiates 2FA setup by generating a secret and QR code for authenticator apps.',
  })
  @ApiOkResponse({
    description: '2FA setup initiated',
    type: SuccessResponse,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: '2FA setup initiated. Check your email for details.',
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'otpauth://totp/Vision-TF...',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          backupCodes: [
            'A1B2C3D4',
            'E5F6G7H8',
            'I9J0K1L2',
            'M3N4O5P6',
            'Q7R8S9T0',
          ],
          instructions:
            'Scan the QR code with your authenticator app or enter the secret manually.',
        },
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/auth/setup-2fa',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  setup2fa(@Req() req: any) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.setup2fa(req.user.userId, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('enable-2fa')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Enable 2FA',
    description:
      'Enables 2FA for the user account after verifying the setup code.',
  })
  @ApiBody({ type: Enable2faDto })
  @ApiOkResponse({
    description: '2FA enabled successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid 2FA code or 2FA not set up',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  enable2fa(@Req() req: any, @Body() dto: Enable2faDto) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.enable2fa(
      req.user.userId,
      dto,
      ipAddress,
      userAgent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable-2fa')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable 2FA',
    description:
      'Disables 2FA for the user account after verifying the current code.',
  })
  @ApiBody({ type: Enable2faDto })
  @ApiOkResponse({
    description: '2FA disabled successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid 2FA code or 2FA not enabled',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  disable2fa(@Req() req: any, @Body() dto: Enable2faDto) {
    return this.authService.disable2fa(req.user.userId, dto);
  }

  @Post('refresh')
  @Version('1')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 token refresh attempts per minute
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Obtains a new access token using a valid refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description:
      'Logs out the user and terminates sessions. Can terminate specific session or all sessions.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token to revoke (optional)',
        },
        sessionToken: {
          type: 'string',
          description: 'Specific session token to terminate (optional)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Logout successful',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  logout(
    @Req() req: any,
    @Body() body: { refreshToken?: string; sessionToken?: string },
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.logout(
      req.user.userId,
      body.refreshToken,
      body.sessionToken,
      ipAddress,
      userAgent,
    );
  }

  // Session management endpoints
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Session Management')
  @ApiOperation({
    summary: 'Get user sessions',
    description: 'Retrieves all active sessions for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'User sessions retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  getUserSessions(@Req() req: any) {
    return this.authService.getUserSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/terminate')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Session Management')
  @ApiOperation({
    summary: 'Terminate sessions',
    description: 'Terminates specific session or all sessions for the user.',
  })
  @ApiBody({ type: TerminateSessionsDto })
  @ApiOkResponse({
    description: 'Session(s) terminated successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  terminateSession(@Req() req: any, @Body() dto: TerminateSessionsDto) {
    if (dto.sessionToken) {
      return this.authService.terminateSession(
        req.user.userId,
        dto.sessionToken,
      );
    } else {
      return this.authService.terminateAllSessions(req.user.userId);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('deactivate')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Deactivate account',
    description: 'Deactivates the user account after password verification.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          description: 'Current password for verification',
        },
      },
      required: ['password'],
    },
  })
  @ApiOkResponse({
    description: 'Account deactivated successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid password or unauthorized',
  })
  deactivateAccount(@Req() req: any, @Body() body: { password: string }) {
    return this.authService.deactivateAccount(req.user.userId, body.password);
  }

  // Admin-only endpoints
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('admin/users')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Admin Operations')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves all users in the system (admin only).',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Post('admin/change-role')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Admin Operations')
  @ApiOperation({
    summary: 'Change user role',
    description: 'Changes the role of a user (admin only).',
  })
  @ApiBody({ type: ChangeUserRoleDto })
  @ApiOkResponse({
    description: 'User role changed successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  changeUserRole(@Req() req: any, @Body() dto: ChangeUserRoleDto) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.changeUserRole(
      dto,
      req.user.userId,
      ipAddress,
      userAgent,
    );
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Post('admin/deactivate-user/:userId')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Admin Operations')
  @ApiOperation({
    summary: 'Deactivate user by admin',
    description: 'Deactivates a user account (admin only).',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to deactivate',
    example: 'e33eab6b-e559-417d-aa99-d606cb7b9ed4',
  })
  @ApiOkResponse({
    description: 'User deactivated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  deactivateUserByAdmin(@Req() req: any, @Param('userId') userId: string) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    return this.authService.deactivateUserByAdmin(
      userId,
      req.user.userId,
      ipAddress,
      userAgent,
    );
  }

  // Developer-only endpoints
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.DEVELOPER)
  @Get('developer/profile')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Get developer profile',
    description:
      'Retrieves developer profile information (developer role only).',
  })
  @ApiOkResponse({
    description: 'Developer profile retrieved successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Developer profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  getDeveloperProfile(@Req() req: any) {
    return this.authService.getDeveloperProfile(req.user.userId);
  }

  // Client-only endpoints
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT)
  @Get('client/profile')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Get client profile',
    description: 'Retrieves client profile information (client role only).',
  })
  @ApiOkResponse({
    description: 'Client profile retrieved successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Client profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Client role required',
  })
  getClientProfile(@Req() req: any) {
    return this.authService.getClientProfile(req.user.userId);
  }

  // Audit endpoints
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('audit/logs')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieves audit logs with optional filtering (admin only).',
  })
  @ApiQuery({ type: AuditQueryDto })
  @ApiOkResponse({
    description: 'Audit logs retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  getAuditLogs(@Query() query: AuditQueryDto) {
    return this.authService.getAuditLogs(query);
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('audit/logs/recent')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Get recent audit logs',
    description: 'Retrieves recent audit logs (admin only).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent logs to retrieve (default: 100)',
  })
  @ApiOkResponse({
    description: 'Recent audit logs retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  getRecentAuditLogs(@Query('limit') limit?: number) {
    return this.authService.getRecentAuditLogs(limit);
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('audit/logs/user/:userId')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Get user audit logs',
    description: 'Retrieves audit logs for a specific user (admin only).',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get audit logs for',
    example: 'e33eab6b-e559-417d-aa99-d606cb7b9ed4',
  })
  @ApiQuery({ type: AuditQueryDto })
  @ApiOkResponse({
    description: 'User audit logs retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  getUserAuditLogs(
    @Param('userId') userId: string,
    @Query() query: AuditQueryDto,
  ) {
    return this.authService.getUserAuditLogs(userId, query.limit, query.offset);
  }

  // Suspicious Activity endpoints
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('security/suspicious-activities')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Get suspicious activities',
    description:
      'Retrieves suspicious activities with optional filtering (admin only).',
  })
  @ApiQuery({ type: SuspiciousActivityQueryDto })
  @ApiOkResponse({
    description: 'Suspicious activities retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  getSuspiciousActivities(@Query() query: SuspiciousActivityQueryDto) {
    return this.authService.getSuspiciousActivities(query);
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Put('security/suspicious-activities/:activityId')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Update suspicious activity status',
    description: 'Updates the status of a suspicious activity (admin only).',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Suspicious activity ID to update',
    example: 'e0b14ef7-57c9-444d-8026-82f2c0161fb2',
  })
  @ApiBody({ type: UpdateSuspiciousActivityDto })
  @ApiOkResponse({
    description: 'Suspicious activity status updated successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    description: 'Suspicious activity not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  updateSuspiciousActivityStatus(
    @Param('activityId') activityId: string,
    @Body() dto: UpdateSuspiciousActivityDto,
    @Req() req: any,
  ) {
    return this.authService.updateSuspiciousActivityStatus(
      activityId,
      dto.status,
      req.user.userId,
      dto.reviewNotes,
    );
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('security/login-patterns/:userId')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Get user login patterns',
    description: 'Retrieves login patterns for a specific user (admin only).',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get login patterns for',
    example: 'e33eab6b-e559-417d-aa99-d606cb7b9ed4',
  })
  @ApiOkResponse({
    description: 'User login patterns retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  getUserLoginPatterns(@Param('userId') userId: string) {
    return this.authService.getUserLoginPatterns(userId);
  }

  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Post('security/detect-password-spray')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Audit & Security')
  @ApiOperation({
    summary: 'Detect password spray attacks',
    description:
      'Triggers password spray attack detection analysis (admin only).',
  })
  @ApiOkResponse({
    description: 'Password spray attack detection completed',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin role required',
  })
  detectPasswordSprayAttack() {
    return this.authService.detectPasswordSprayAttack();
  }
}
