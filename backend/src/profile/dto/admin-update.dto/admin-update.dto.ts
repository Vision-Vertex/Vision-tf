import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export class AdminUpdateDto {
  // Account Status (User table)
  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Account deletion status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // System Roles & Permissions (Profile table)
  @ApiPropertyOptional({
    description: 'System role for internal use',
    example: 'senior_developer',
  })
  @IsOptional()
  @IsString()
  systemRole?: string;

  @ApiPropertyOptional({
    description: 'System permissions array',
    example: ['manage_projects', 'view_analytics'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Admin-specific preferences',
    example: {
      notificationSettings: { email: true, push: false },
      dashboardPreferences: { defaultView: 'list' },
    },
  })
  @IsOptional()
  @IsObject()
  adminPreferences?: any;

  // System Metadata (Profile table)
  @ApiPropertyOptional({
    description: 'Last system access timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsString()
  lastSystemAccess?: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Account flagged for review due to suspicious activity',
  })
  @IsOptional()
  @IsString()
  systemNotes?: string;

  @ApiPropertyOptional({
    description: 'Flag for content review',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  flaggedForReview?: boolean;

  @ApiPropertyOptional({
    description: 'Manual verification status',
    enum: VerificationStatus,
    example: VerificationStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  // Platform Settings (Profile table)
  @ApiPropertyOptional({
    description: 'Feature access flags',
    example: {
      premiumFeatures: true,
      betaFeatures: false,
      advancedAnalytics: true,
    },
  })
  @IsOptional()
  @IsObject()
  featureFlags?: any;

  @ApiPropertyOptional({
    description: 'Platform-specific settings',
    example: {
      language: 'en',
      timezone: 'UTC',
      theme: 'dark',
    },
  })
  @IsOptional()
  @IsObject()
  platformSettings?: any;
}

export class AdminUpdateResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Profile updated successfully by admin',
  })
  message: string;

  @ApiProperty({
    description: 'Updated profile information',
    example: {
      userId: 'uuid-string',
      systemRole: 'senior_developer',
      status: 'active',
      updatedAt: '2025-01-15T10:30:00Z',
    },
  })
  profile: {
    userId: string;
    systemRole?: string;
    status?: string;
    updatedAt: string;
  };

  @ApiProperty({
    description: 'Fields that were updated',
    example: ['systemRole', 'status'],
  })
  updatedFields: string[];

  @ApiProperty({
    description: 'Admin who performed the update',
    example: 'admin-user-id',
  })
  updatedBy: string;
}
