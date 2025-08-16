import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EducationDto,
  CertificationDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { SuccessResponse } from '../../common/dto/api-response.dto';
import { AuditService } from '../services/audit.service';
import { CloudStorageService } from '../services/cloud-storage.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface CertificationWithFile extends CertificationDto {
  id: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: Date;
}

export interface EducationWithCertifications {
  degree?: string;
  institution?: string;
  graduationYear?: number;
  certifications?: CertificationWithFile[];
}

@Injectable()
export class EducationProfileService {
  private readonly uploadDir = './uploads/certifications';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedFileTypes = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.doc',
    '.docx',
  ];

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private cloudStorageService: CloudStorageService,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Update education information for a user
   */
  async updateEducation(
    userId: string,
    educationData: EducationDto,
  ): Promise<SuccessResponse> {
    this.validateEducationData(educationData);

    try {
      const updatedProfile = await this.prisma.profile
        .update({
          where: { userId },
          data: {
            education: educationData,
          },
          select: { education: true },
        })
        .catch(() => null);

      if (!updatedProfile) {
        throw new NotFoundException('Profile not found');
      }

      await this.auditService.logProfileUpdate(
        userId,
        { education: educationData },
        {
          operation: 'education_update',
          fieldsUpdated: ['education'],
        },
      );

      return new SuccessResponse(
        'Education updated successfully',
        updatedProfile.education,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'education update');
    }
  }

  /**
   * Add a new certification with optional file upload
   */
  async addCertification(
    userId: string,
    certificationData: CertificationDto,
    file?: Express.Multer.File,
  ): Promise<SuccessResponse> {
    this.validateCertificationData(certificationData);

    let fileInfo:
      | { fileUrl: string; fileName: string; fileSize: number }
      | undefined;
    let uploadedFileUrl: string | undefined;

    try {
      // Use transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Get current education data with optimized query
        const profile = await tx.profile
          .findUnique({
            where: { userId },
            select: { education: true },
          })
          .catch(() => null);

        if (!profile) {
          throw new NotFoundException('Profile not found');
        }

        const currentEducation =
          (profile.education as EducationWithCertifications) || {};
        const certifications = currentEducation.certifications || [];

        // Create new certification
        const newCertification: CertificationWithFile = {
          id: uuidv4(),
          ...certificationData,
          uploadedAt: new Date(),
        };

        // Handle file upload if provided
        if (file) {
          fileInfo = await this.handleFileUpload(
            file,
            userId,
            newCertification.id,
          );
          uploadedFileUrl = fileInfo.fileUrl;

          newCertification.fileUrl = fileInfo.fileUrl;
          newCertification.fileName = fileInfo.fileName;
          newCertification.fileSize = fileInfo.fileSize;
        }

        // Add to certifications array
        certifications.push(newCertification);

        // Update profile
        const updatedProfile = await tx.profile.update({
          where: { userId },
          data: {
            education: {
              ...currentEducation,
              certifications,
            },
          },
        });

        // Log audit trail
        await this.auditService.logProfileUpdate(
          userId,
          {
            certificationAdded: newCertification,
          },
          {
            operation: 'certification_added',
            fieldsUpdated: ['education.certifications'],
          },
        );

        return new SuccessResponse(
          'Certification added successfully',
          newCertification,
        );
      });
    } catch (error) {
      // Cleanup uploaded file if database transaction failed
      if (uploadedFileUrl) {
        try {
          await this.cloudStorageService.deleteFile(uploadedFileUrl);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
      }

      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'certification addition');
    }
  }

  /**
   * Remove a certification by ID
   */
  async removeCertification(
    userId: string,
    certificationId: string,
  ): Promise<SuccessResponse> {
    try {
      // Use transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Get current education data with optimized query
        const profile = await tx.profile
          .findUnique({
            where: { userId },
            select: { education: true },
          })
          .catch(() => null);

        if (!profile) {
          throw new NotFoundException('Profile not found');
        }

        const currentEducation =
          (profile.education as EducationWithCertifications) || {};
        const certifications = currentEducation.certifications || [];

        // Find certification to remove
        const certificationIndex = certifications.findIndex(
          (cert) => cert.id === certificationId,
        );
        if (certificationIndex === -1) {
          throw new NotFoundException('Certification not found');
        }

        const certificationToRemove = certifications[certificationIndex];

        // Remove from array first
        certifications.splice(certificationIndex, 1);

        // Update profile
        const updatedProfile = await tx.profile.update({
          where: { userId },
          data: {
            education: {
              ...currentEducation,
              certifications,
            },
          },
        });

        // Log audit trail
        await this.auditService.logProfileUpdate(
          userId,
          {
            certificationRemoved: certificationToRemove,
          },
          {
            operation: 'certification_removed',
            fieldsUpdated: ['education.certifications'],
          },
        );

        // Remove file after successful database update
        if (certificationToRemove.fileUrl) {
          try {
            await this.cloudStorageService.deleteFile(
              certificationToRemove.fileUrl,
            );
          } catch (fileError) {
            console.error('Failed to delete file:', fileError);
            // Don't fail the operation if file deletion fails
          }
        }

        return new SuccessResponse('Certification removed successfully', {
          removedId: certificationId,
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'certification removal');
    }
  }

  /**
   * Get education information for a user
   */
  async getEducation(userId: string): Promise<SuccessResponse> {
    try {
      const profile = await this.prisma.profile
        .findUnique({
          where: { userId },
          select: { education: true },
        })
        .catch(() => null);

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      return new SuccessResponse(
        'Education retrieved successfully',
        profile.education,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'education retrieval');
    }
  }

  /**
   * Download certification file
   */
  async downloadCertificationFile(
    userId: string,
    certificationId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    try {
      const profile = await this.prisma.profile
        .findUnique({
          where: { userId },
          select: { education: true },
        })
        .catch(() => null);

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      const currentEducation =
        (profile.education as EducationWithCertifications) || {};
      const certifications = currentEducation.certifications || [];

      const certification = certifications.find(
        (cert) => cert.id === certificationId,
      );
      if (!certification) {
        throw new NotFoundException('Certification not found');
      }

      if (!certification.fileUrl) {
        throw new BadRequestException(
          'No file associated with this certification',
        );
      }

      // Security: Prevent path traversal attacks
      const uploadDir = path.resolve(this.uploadDir);
      const filePath = path.resolve(certification.fileUrl);

      if (!filePath.startsWith(uploadDir)) {
        throw new BadRequestException('Invalid file path');
      }

      // Check if file exists using async operation
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
      } catch {
        throw new NotFoundException('File not found on server');
      }

      return {
        filePath,
        fileName: certification.fileName || 'certification.pdf',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'file download');
    }
  }

  /**
   * Handle file upload with validation
   */
  private async handleFileUpload(
    file: Express.Multer.File,
    userId: string,
    certificationId: string,
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    // File validation is already done by ParseFilePipe in controller
    // Only perform additional business logic validation here

    // Create unique filename
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${userId}_${certificationId}_${Date.now()}${fileExtension}`;

    try {
      // Use cloud storage service for file upload
      const uploadResult = await this.cloudStorageService.uploadFile(
        file.buffer,
        fileName,
        'certifications',
      );

      return {
        fileUrl: uploadResult.fileUrl,
        fileName: file.originalname,
        fileSize: uploadResult.fileSize,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate file upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!this.allowedFileTypes.includes(fileExtension)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`,
      );
    }

    // Validate file content (basic check)
    if (
      file.mimetype &&
      !file.mimetype.startsWith('application/') &&
      !file.mimetype.startsWith('image/')
    ) {
      throw new BadRequestException('Invalid file type');
    }
  }

  /**
   * Validate education data
   */
  private validateEducationData(education: EducationDto): void {
    if (education.degree && education.degree.trim().length < 2) {
      throw new BadRequestException(
        'Degree must be at least 2 characters long',
      );
    }

    if (education.institution && education.institution.trim().length < 2) {
      throw new BadRequestException(
        'Institution must be at least 2 characters long',
      );
    }

    if (education.graduationYear) {
      const currentYear = new Date().getFullYear();
      if (
        education.graduationYear < 1900 ||
        education.graduationYear > currentYear + 10
      ) {
        throw new BadRequestException(
          `Graduation year must be between 1900 and ${currentYear + 10}`,
        );
      }
    }
  }

  /**
   * Validate certification data
   */
  private validateCertificationData(certification: CertificationDto): void {
    if (!certification.name || certification.name.trim().length < 2) {
      throw new BadRequestException(
        'Certification name must be at least 2 characters long',
      );
    }

    if (!certification.issuer || certification.issuer.trim().length < 2) {
      throw new BadRequestException(
        'Issuer must be at least 2 characters long',
      );
    }

    if (!certification.dateObtained) {
      throw new BadRequestException('Date obtained is required');
    }

    // Validate date format and logic
    const obtainedDate = new Date(certification.dateObtained);
    if (isNaN(obtainedDate.getTime())) {
      throw new BadRequestException('Invalid date obtained format');
    }

    if (obtainedDate > new Date()) {
      throw new BadRequestException('Date obtained cannot be in the future');
    }

    if (certification.expiryDate) {
      const expiryDate = new Date(certification.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        throw new BadRequestException('Invalid expiry date format');
      }

      if (expiryDate <= obtainedDate) {
        throw new BadRequestException(
          'Expiry date must be after date obtained',
        );
      }
    }

    if (
      certification.credentialId &&
      certification.credentialId.trim().length < 3
    ) {
      throw new BadRequestException(
        'Credential ID must be at least 3 characters long',
      );
    }
  }

  /**
   * Handle Prisma errors
   */
  private handlePrismaError(error: any, operation: string): never {
    switch (error.code) {
      case 'P2025':
        throw new NotFoundException(`User not found for ${operation}`);
      case 'P2002':
        throw new BadRequestException(`Duplicate entry in ${operation}`);
      case 'P2003':
        throw new BadRequestException(
          `Invalid foreign key reference in ${operation}`,
        );
      case 'P2014':
        throw new BadRequestException(`Invalid ID provided for ${operation}`);
      case 'P2021':
        throw new InternalServerErrorException('Database table does not exist');
      case 'P2022':
        throw new InternalServerErrorException(
          'Database column does not exist',
        );
      case 'P2012':
        throw new BadRequestException(
          `Missing required value for ${operation}`,
        );
      case 'P2013':
        throw new BadRequestException(
          `Missing required argument for ${operation}`,
        );
      default:
        console.error(`Prisma error in ${operation}:`, error);
        throw new InternalServerErrorException(
          `Database operation failed: ${operation}`,
        );
    }
  }
}
