import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { SessionService } from './session.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { SuspiciousActivityService } from '../security/suspicious-activity.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            login: jest.fn(),
            verifyEmail: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            setup2fa: jest.fn(),
            enable2fa: jest.fn(),
            verify2fa: jest.fn(),
            disable2fa: jest.fn(),
            getUserSessions: jest.fn(),
            terminateSession: jest.fn(),
            terminateAllSessions: jest.fn(),
            deactivateAccount: jest.fn(),
            getAllUsers: jest.fn(),
            changeUserRole: jest.fn(),
            deactivateUserByAdmin: jest.fn(),
            getDeveloperProfile: jest.fn(),
            getClientProfile: jest.fn(),
            getAuditLogs: jest.fn(),
            getRecentAuditLogs: jest.fn(),
            getUserAuditLogs: jest.fn(),
            getSuspiciousActivities: jest.fn(),
            updateSuspiciousActivityStatus: jest.fn(),
            getUserLoginPatterns: jest.fn(),
            detectPasswordSprayAttack: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            session: {
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            auditLog: {
              findMany: jest.fn(),
            },
            suspiciousActivity: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
            loginPattern: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: TwoFactorService,
          useValue: {
            generateSecret: jest.fn(),
            generateQRCode: jest.fn(),
            verifyToken: jest.fn(),
            generateBackupCodes: jest.fn(),
            verifyBackupCode: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            getUserSessions: jest.fn(),
            terminateSession: jest.fn(),
            terminateAllUserSessions: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmailVerification: jest.fn(),
            sendPasswordReset: jest.fn(),
            send2faSetup: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logUserAction: jest.fn(),
            logSecurityEvent: jest.fn(),
            logSystemEvent: jest.fn(),
            getAuditLogs: jest.fn(),
            exportAuditLogs: jest.fn(),
          },
        },
        {
          provide: SuspiciousActivityService,
          useValue: {
            detectBruteForce: jest.fn(),
            analyzeLoginPatterns: jest.fn(),
            calculateRiskScore: jest.fn(),
            getSuspiciousActivities: jest.fn(),
            reviewActivity: jest.fn(),
            exportSuspiciousActivities: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have all required methods', () => {
    expect(controller.signup).toBeDefined();
    expect(controller.login).toBeDefined();
    expect(controller.verifyEmail).toBeDefined();
    expect(controller.forgotPassword).toBeDefined();
    expect(controller.resetPassword).toBeDefined();
    expect(controller.refreshToken).toBeDefined();
    expect(controller.logout).toBeDefined();
    expect(controller.setup2fa).toBeDefined();
    expect(controller.enable2fa).toBeDefined();
    expect(controller.verify2fa).toBeDefined();
    expect(controller.disable2fa).toBeDefined();
    expect(controller.getUserSessions).toBeDefined();
    expect(controller.terminateSession).toBeDefined();
    expect(controller.deactivateAccount).toBeDefined();
    expect(controller.getAllUsers).toBeDefined();
    expect(controller.changeUserRole).toBeDefined();
    expect(controller.deactivateUserByAdmin).toBeDefined();
    expect(controller.getDeveloperProfile).toBeDefined();
    expect(controller.getClientProfile).toBeDefined();
    expect(controller.getAuditLogs).toBeDefined();
    expect(controller.getRecentAuditLogs).toBeDefined();
    expect(controller.getUserAuditLogs).toBeDefined();
    expect(controller.getSuspiciousActivities).toBeDefined();
    expect(controller.updateSuspiciousActivityStatus).toBeDefined();
    expect(controller.getUserLoginPatterns).toBeDefined();
    expect(controller.detectPasswordSprayAttack).toBeDefined();
  });
});
