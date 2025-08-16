/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { TwoFactorService } from './two-factor.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { AdminSignupDto } from './dto/admin-signup.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { SessionService } from './session.service';
import { AuditService } from '../audit/audit.service';
import {
  SuspiciousActivityService,
  LoginContext,
} from '../security/suspicious-activity.service';
import { SuspiciousActivityStatus } from '@prisma/client';
import {
  SuccessResponse,
  CreatedResponse,
} from '../common/dto/api-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private emailService: EmailService,
    private twoFactorService: TwoFactorService,
    private sessionService: SessionService,
    private auditService: AuditService,
    private suspiciousActivityService: SuspiciousActivityService,
  ) {}

  async signup(dto: SignupDto) {
    // Validate that only CLIENT and DEVELOPER roles are allowed for regular signup
    if (dto.role === 'ADMIN') {
      throw new BadRequestException(
        'Admin users must use the admin signup endpoint',
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });
    if (existing)
      throw new ConflictException('Email or username already taken');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user and profile in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
          emailVerificationToken,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Create profile with role-specific defaults
      const displayName = `${dto.firstname} ${dto.lastname}`.trim();

      // Prepare profile data with role-specific defaults
      const profileCreateData: any = {
        userId: user.id,
        displayName,
        bio: null,
        profilePictureUrl: null,
        chatLastReadAt: null,
        skills: [],
        experience: null,
        availability: undefined,
        portfolioLinks: [],
        companyName: null,
        companyWebsite: null,
        billingAddress: null,
        updatedAt: new Date(),
      };

      // Apply role-specific customizations
      switch (user.role) {
        case 'CLIENT':
          // Keep default values for CLIENT
          break;
        case 'DEVELOPER':
          profileCreateData.experience = 0; // Default to 0 years
          profileCreateData.availability = { available: true, hours: '9-5' }; // Default availability
          break;
        case 'ADMIN':
          profileCreateData.companyName = 'Vision-TF System'; // Default system name
          break;
      }

      const profile = await prisma.profile.create({
        data: profileCreateData,
      });

      return { user, profile };
    });

    // Send verification email
    await this.emailService.sendEmailVerification(
      result.user.email,
      emailVerificationToken,
    );

    // Log user registration
    await this.auditService.logUserRegistered(
      result.user.id,
      result.user.email,
    );

    return new CreatedResponse(
      'User registered successfully. Please check your email to verify your account.',
      {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        isEmailVerified: result.user.isEmailVerified,
        profile: {
          displayName: result.profile.displayName,
          role: result.user.role,
        },
      },
    );
  }

  async signupAdmin(dto: AdminSignupDto) {
    // Enhanced uniqueness check with specific error messages
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email address is already registered');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Check if any admin exists for bootstrap logic
    const adminExists = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminExists) {
      // First admin - validate against env code
      if (dto.invitationCode !== process.env.FIRST_ADMIN_CODE) {
        throw new BadRequestException('Invalid first admin setup code');
      }

      console.log('🔧 Setup mode: Creating first admin user');
      return this.createAdminUser(dto);
    }

    // Subsequent admin creation - validate invitation
    return this.createSubsequentAdmin(dto);
  }

  private async createAdminUser(dto: AdminSignupDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Destructure DTO to exclude invitationCode which is not part of User model
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { invitationCode, ...userData } = dto;

    const result = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerificationToken,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isEmailVerified: true, // Auto-verify first admin
        },
      });

      // Create admin profile with admin-specific defaults
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          displayName: `${dto.firstname} ${dto.lastname}`.trim(),
          companyName: 'Vision-TF System',
          bio: null,
          profilePictureUrl: null,
          chatLastReadAt: null,
          skills: [],
          experience: null,
          availability: undefined,
          portfolioLinks: [],
          companyWebsite: null,
          billingAddress: undefined,
        },
      });

      return { user, profile };
    });

    // Admin users are auto-verified, no need to send verification email
    // await this.emailService.sendEmailVerification(
    //   result.user.email,
    //   emailVerificationToken,
    // );

    // Log admin creation
    await this.auditService.logUserRegistered(
      result.user.id,
      result.user.email,
    );

    return new CreatedResponse(
      'Admin created successfully! Email automatically verified. Remember to disable setup mode.',
      {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        isEmailVerified: result.user.isEmailVerified,
        profile: {
          displayName: result.profile.displayName,
          role: result.user.role,
        },
      },
    );
  }

  private async createSubsequentAdmin(dto: AdminSignupDto) {
    // Reject if using the setup code
    if (dto.invitationCode === process.env.FIRST_ADMIN_CODE) {
      throw new BadRequestException('Invalid invitation code');
    }

    // First check if there's any invitation for this email
    const emailInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        role: 'ADMIN',
        expiresAt: { gt: new Date() },
        used: false,
      },
    });

    if (!emailInvitation) {
      throw new BadRequestException('No invitation sent to this email');
    }

    // Now check if the invitation code matches
    if (emailInvitation.code !== dto.invitationCode) {
      throw new BadRequestException('Invalid invitation code');
    }

    // Create admin and mark invitation as used
    const result = await this.createAdminUser(dto);

    await this.prisma.invitation.update({
      where: { id: emailInvitation.id },
      data: {
        used: true,
        usedAt: new Date(),
        usedBy: result.data?.id,
      },
    });

    return result;
  }

  async inviteAdmin(
    dto: InviteAdminDto,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (existingUser.role === 'ADMIN') {
        throw new ConflictException('User is already an admin');
      } else {
        throw new ConflictException(
          'User already exists with a different role. Please change their role instead.',
        );
      }
    }

    // Check if there's any invitation (used or unused) for this email
    const anyInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        role: 'ADMIN',
      },
    });

    if (anyInvitation) {
      if (anyInvitation.used) {
        throw new ConflictException(
          'User has already signed up using an invitation for this email',
        );
      } else {
        throw new ConflictException(
          'An active invitation already exists for this email',
        );
      }
    }

    const invitationCode = crypto.randomBytes(16).toString('hex');

    // Create invitation record
    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        code: invitationCode,
        role: 'ADMIN',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdBy: adminUserId,
      },
    });

    // Log invitation creation
    console.log(
      `Admin invitation sent to ${dto.email} with code: ${invitationCode}`,
    );

    // Log invitation creation
    await this.auditService.logAdminInvitationCreated(
      adminUserId,
      dto.email,
      invitation.id,
      ipAddress,
      userAgent,
    );

    return new SuccessResponse('Admin invitation sent successfully', {
      invitationId: invitation.id,
      email: dto.email,
      expiresAt: invitation.expiresAt,
    });
  }

  async resendInvitation(
    invitationId: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is already used
    if (invitation.used) {
      throw new BadRequestException(
        'User has already signed up using this invitation',
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists (in case they signed up without using the invitation)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User has already signed up with this email',
      );
    }

    // Generate new invitation code
    const newInvitationCode = crypto.randomBytes(16).toString('hex');

    // Update invitation with new code and extend expiration
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        code: newInvitationCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log invitation resend
    console.log(
      `Admin invitation resent to ${invitation.email} with new code: ${newInvitationCode}`,
    );

    // Log invitation resend
    await this.auditService.logAdminInvitationCreated(
      adminUserId,
      invitation.email,
      invitation.id,
      ipAddress,
      userAgent,
    );

    return new SuccessResponse('Admin invitation resent successfully', {
      invitationId: updatedInvitation.id,
      email: updatedInvitation.email,
      expiresAt: updatedInvitation.expiresAt,
    });
  }

  async deleteInvitation(
    invitationId: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is already used
    if (invitation.used) {
      throw new BadRequestException(
        'Cannot delete an invitation that has already been used',
      );
    }

    // Delete the invitation
    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    // Log invitation deletion
    await this.auditService.log({
      userId: adminUserId,
      eventType: 'USER_DELETED', // Using existing event type
      eventCategory: 'USER_MANAGEMENT',
      description: `Admin invitation deleted for ${invitation.email}`,
      details: {
        invitationId,
        email: invitation.email,
        action: 'admin_invitation_deleted',
      },
      ipAddress,
      userAgent,
      severity: 'INFO',
    });

    return new SuccessResponse('Admin invitation deleted successfully');
  }

  async getInvitations(adminUserId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        createdBy: adminUserId,
        role: 'ADMIN',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return new SuccessResponse('Invitations retrieved successfully', {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        used: inv.used,
        usedAt: inv.usedAt,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        usedBy: inv.user
          ? {
              id: inv.user.id,
              email: inv.user.email,
              username: inv.user.username,
            }
          : null,
      })),
    });
  }

  async login(dto: LoginDto, userAgent: string, ipAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new ForbiddenException(
        'Account is temporarily locked. Please try again later.',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Lock account after 5 failed attempts for 15 minutes
      if (failedAttempts >= 5) {
        updateData.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        // Log account locked
        await this.auditService.logAccountLocked(user.id, ipAddress, userAgent);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Log failed login attempt
      await this.auditService.logLoginFailed(
        dto.email,
        ipAddress,
        userAgent,
        'Invalid password',
      );

      // Detect brute force attacks
      await this.suspiciousActivityService.detectBruteForceAttack(ipAddress);

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAt: new Date(),
        },
      });
      // Log account unlocked
      await this.auditService.logAccountUnlocked(user.id, ipAddress, userAgent);
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return new SuccessResponse('Two-factor authentication required', {
        requires2FA: true,
        message: 'Two-factor authentication required',
      });
    }

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      userAgent,
      ipAddress,
      dto.rememberMe || false,
    );

    // Analyze login activity for suspicious behavior
    const loginContext: LoginContext = {
      userId: user.id,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    const riskAssessment =
      await this.suspiciousActivityService.analyzeLoginActivity(loginContext);

    // Log successful login
    await this.auditService.logUserLogin(
      user.id,
      ipAddress,
      userAgent,
      session.sessionToken,
    );
    await this.auditService.logSessionCreated(
      user.id,
      session.sessionToken,
      ipAddress,
      userAgent,
    );

    // Detect and log suspicious activity if risk is significant
    if (riskAssessment.riskScore >= 20) {
      await this.suspiciousActivityService.detectSuspiciousActivity(
        user.id,
        'UNUSUAL_LOGIN_TIME', // This will be refined based on actual risk factors
        `Suspicious login detected with risk score: ${riskAssessment.riskScore}`,
        {
          riskFactors: riskAssessment.riskFactors,
          confidence: riskAssessment.confidence,
        },
        loginContext,
        riskAssessment,
      );
    }

    return await this._signToken(
      user.id,
      user.email,
      user.role,
      session.sessionToken,
    );
  }

  async verify2fa(dto: Verify2faDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      await this.auditService.logLoginFailed(
        dto.email,
        ipAddress,
        userAgent,
        'Invalid password in 2FA verification',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidToken = this.twoFactorService.verifyToken(
      dto.code,
      user.twoFactorSecret!,
    );
    if (!isValidToken) {
      // Check backup codes
      const isValidBackupCode = this.twoFactorService.verifyBackupCode(
        dto.code,
        user.twoFactorBackupCodes,
      );
      if (!isValidBackupCode) {
        await this.auditService.logTwoFactorVerificationFailed(
          user.id,
          ipAddress,
          userAgent,
        );
        throw new UnauthorizedException('Invalid 2FA code');
      }

      // Update backup codes after use
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: user.twoFactorBackupCodes },
      });
    }

    // Create session after successful 2FA verification
    const session = await this.sessionService.createSession(
      user.id,
      userAgent || 'Unknown',
      ipAddress || 'Unknown',
      false, // Default to false for 2FA, can be enhanced later
    );

    // Analyze login activity for suspicious behavior
    const loginContext: LoginContext = {
      userId: user.id,
      ipAddress: ipAddress || 'Unknown',
      userAgent: userAgent || 'Unknown',
      timestamp: new Date(),
    };

    const riskAssessment =
      await this.suspiciousActivityService.analyzeLoginActivity(loginContext);

    // Log successful 2FA verification and login
    await this.auditService.logUserLogin(
      user.id,
      ipAddress,
      userAgent,
      session.sessionToken,
    );
    await this.auditService.logSessionCreated(
      user.id,
      session.sessionToken,
      ipAddress,
      userAgent,
    );

    // Detect and log suspicious activity if risk is significant
    if (riskAssessment.riskScore >= 20) {
      await this.suspiciousActivityService.detectSuspiciousActivity(
        user.id,
        'UNUSUAL_LOGIN_TIME',
        `Suspicious login detected with risk score: ${riskAssessment.riskScore}`,
        {
          riskFactors: riskAssessment.riskFactors,
          confidence: riskAssessment.confidence,
        },
        loginContext,
        riskAssessment,
      );
    }

    return await this._signToken(
      user.id,
      user.email,
      user.role,
      session.sessionToken,
    );
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: dto.token,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return new SuccessResponse('Email verified successfully');
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return new SuccessResponse(
        'If the email exists, a password reset link has been sent.',
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    await this.emailService.sendPasswordReset(user.email, resetToken);

    // Log password reset request
    await this.auditService.logPasswordResetRequested(
      user.email,
      ipAddress,
      userAgent,
    );

    return new SuccessResponse(
      'If the email exists, a password reset link has been sent.',
    );
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    // Log password reset completion
    await this.auditService.logPasswordResetCompleted(
      user.id,
      ipAddress,
      userAgent,
    );

    return new SuccessResponse('Password reset successfully');
  }

  async setup2fa(userId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const { secret, qrCodeUrl } = this.twoFactorService.generateSecret(
      user.email,
    );
    const qrCode = await this.twoFactorService.generateQRCode(qrCodeUrl);
    const backupCodes = this.twoFactorService.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
      },
    });

    await this.emailService.send2faSetup(user.email, secret, qrCode);

    // Log 2FA setup
    await this.auditService.logTwoFactorSetup(userId, ipAddress, userAgent);

    return new SuccessResponse(
      '2FA setup initiated. Check your email for details.',
      {
        secret,
        qrCodeUrl,
        qrCode,
        backupCodes,
        instructions:
          'Scan the QR code with your authenticator app or enter the secret manually.',
      },
    );
  }

  async enable2fa(
    userId: string,
    dto: Enable2faDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not set up');
    }

    const isValid = this.twoFactorService.verifyToken(
      dto.code,
      user.twoFactorSecret,
    );
    if (!isValid) {
      // Log failed 2FA verification
      await this.auditService.logTwoFactorVerificationFailed(
        userId,
        ipAddress,
        userAgent,
      );
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Log 2FA enabled
    await this.auditService.logTwoFactorEnabled(userId, ipAddress, userAgent);

    return new SuccessResponse(
      'Two-factor authentication enabled successfully',
    );
  }

  async disable2fa(userId: string, dto: Enable2faDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA not enabled');
    }

    const isValid = this.twoFactorService.verifyToken(
      dto.code,
      user.twoFactorSecret!,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    return new SuccessResponse(
      'Two-factor authentication disabled successfully',
    );
  }

  async refreshToken(dto: RefreshTokenDto) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (
      !refreshToken ||
      refreshToken.isRevoked ||
      refreshToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return await this._signToken(
      refreshToken.user.id,
      refreshToken.user.email,
      refreshToken.user.role,
    );
  }

  async logout(
    userId: string,
    refreshToken?: string,
    sessionToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (refreshToken) {
      // Use updateMany to avoid error if token doesn't exist
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }

    if (sessionToken) {
      // Terminate specific session
      await this.sessionService.terminateSession(sessionToken);
      await this.auditService.logUserLogout(
        userId,
        ipAddress,
        userAgent,
        sessionToken,
      );
      await this.auditService.logSessionTerminated(
        userId,
        sessionToken,
        ipAddress,
        userAgent,
      );
      return new SuccessResponse('Logged out from this device successfully');
    } else {
      // Terminate all user sessions
      await this.sessionService.terminateAllUserSessions(userId);
      await this.auditService.logUserLogout(userId, ipAddress, userAgent);
      await this.auditService.logAllSessionsTerminated(
        userId,
        ipAddress,
        userAgent,
      );
      return new SuccessResponse('Logged out from all devices successfully');
    }
  }

  async deactivateAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid password');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Revoke all tokens and sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return new SuccessResponse('Account deactivated successfully');
  }

  private async _signToken(
    userId: string,
    email: string,
    role: string,
    sessionToken?: string,
  ) {
    const payload = { sub: userId, email, role, sessionToken };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return new SuccessResponse('Authentication successful', {
      accessToken,
      refreshToken,
      sessionToken, // Include session token for client-side session management
    });
  }

  // Admin methods
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        username: true,
        role: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return new SuccessResponse('Users retrieved successfully', { users });
  }

  async changeUserRole(
    dto: ChangeUserRoleDto,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const oldRole = user.role;

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: dto.newRole },
    });

    // Log role change
    await this.auditService.logUserRoleChanged(
      adminUserId,
      dto.userId,
      oldRole,
      dto.newRole,
      ipAddress,
      userAgent,
    );

    return new SuccessResponse(`User role changed to ${dto.newRole}`);
  }

  async deactivateUserByAdmin(
    userId: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Revoke all tokens and sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Log user deactivation
    await this.auditService.logUserDeactivated(
      adminUserId,
      userId,
      ipAddress,
      userAgent,
    );

    return new SuccessResponse('User deactivated successfully');
  }

  // Developer methods
  async getDeveloperProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.role !== 'DEVELOPER') {
      throw new BadRequestException('Developer profile not found');
    }

    return new SuccessResponse('Developer profile retrieved successfully', {
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
    });
  }

  // Client methods
  async getClientProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.role !== 'CLIENT') {
      throw new BadRequestException('Client profile not found');
    }

    return new SuccessResponse('Client profile retrieved successfully', {
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
    });
  }

  // Session management methods
  async getUserSessions(userId: string) {
    const sessions = await this.sessionService.getUserSessions(userId);
    return new SuccessResponse('User sessions retrieved successfully', {
      sessions: sessions.map((session) => ({
        id: session.id,
        deviceName: session.deviceName,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        lastActivityAt: session.lastActivityAt,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        rememberMe: session.rememberMe,
      })),
    });
  }

  async terminateSession(userId: string, sessionToken: string) {
    // Verify the session belongs to the user
    const session = await this.prisma.session.findFirst({
      where: {
        sessionToken,
        userId,
        isActive: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found or already terminated');
    }

    await this.sessionService.terminateSession(sessionToken);
    return new SuccessResponse('Session terminated successfully');
  }

  async terminateAllSessions(userId: string) {
    await this.sessionService.terminateAllUserSessions(userId);
    return new SuccessResponse('All sessions terminated successfully');
  }

  // Audit query methods
  async getAuditLogs(query: any) {
    const {
      eventType,
      eventCategory,
      severity,
      limit = 50,
      offset = 0,
    } = query;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (eventCategory) where.eventCategory = eventCategory;
    if (severity) where.severity = severity;

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return new SuccessResponse('Audit logs retrieved successfully', { logs });
  }

  async getRecentAuditLogs(limit: number = 100) {
    const logs = await this.auditService.getRecentAuditLogs(limit);
    return new SuccessResponse('Recent audit logs retrieved successfully', {
      logs,
    });
  }

  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const logs = await this.auditService.getUserAuditLogs(
      userId,
      limit,
      offset,
    );
    return new SuccessResponse('User audit logs retrieved successfully', {
      logs,
    });
  }

  // Suspicious activity methods
  async getSuspiciousActivities(query: any) {
    const { userId, status, limit = 50, offset = 0 } = query;
    const activities =
      await this.suspiciousActivityService.getSuspiciousActivities(
        userId,
        status,
        limit,
        offset,
      );
    return new SuccessResponse('Suspicious activities retrieved successfully', {
      activities,
    });
  }

  async updateSuspiciousActivityStatus(
    activityId: string,
    status: SuspiciousActivityStatus,
    adminUserId: string,
    reviewNotes?: string,
  ) {
    const result =
      await this.suspiciousActivityService.updateSuspiciousActivityStatus(
        activityId,
        status,
        adminUserId,
        reviewNotes,
      );
    return new SuccessResponse(
      'Suspicious activity status updated successfully',
      result,
    );
  }

  async getUserLoginPatterns(userId: string) {
    const patterns =
      await this.suspiciousActivityService.getUserLoginPatterns(userId);
    return new SuccessResponse('User login patterns retrieved successfully', {
      patterns,
    });
  }

  async detectPasswordSprayAttack() {
    const result =
      await this.suspiciousActivityService.detectPasswordSprayAttack();
    return new SuccessResponse(
      'Password spray attack detection completed',
      result,
    );
  }
}
