import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  EducationProfileService,
  CertificationWithFile,
  EducationWithCertifications,
} from './education-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../services/audit.service';
import { CloudStorageService } from '../services/cloud-storage.service';
import {
  EducationDto,
  CertificationDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { SuccessResponse } from '../../common/dto/api-response.dto';

describe('EducationProfileService', () => {
  let service: EducationProfileService;
  let prismaService: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;
  let cloudStorageService: jest.Mocked<CloudStorageService>;

  const mockUserId = 'user-123';
  const mockCertificationId = 'cert-123';

  const mockEducationData: EducationDto = {
    degree: "Bachelor's in Computer Science",
    institution: 'MIT',
    graduationYear: 2020,
  };

  const mockCertificationData: CertificationDto = {
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon',
    dateObtained: '2023-01-15',
    expiryDate: '2025-01-15',
    credentialId: '12345-abcde',
  };

  const mockCertificationWithFile: CertificationWithFile = {
    id: mockCertificationId,
    ...mockCertificationData,
    fileUrl: './uploads/certifications/user-123_cert-123_1234567890.pdf',
    fileName: 'aws-certification.pdf',
    fileSize: 1024000,
    uploadedAt: new Date(),
  };

  const mockProfile = {
    id: 'profile-123',
    userId: mockUserId,
    education: {
      degree: "Bachelor's in Computer Science",
      institution: 'MIT',
      graduationYear: 2020,
      certifications: [mockCertificationWithFile],
    },
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-certification.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024000,
    buffer: Buffer.from('test file content'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      profile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockAuditService = {
      logProfileUpdate: jest.fn(),
    };

    const mockCloudStorageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: CloudStorageService,
          useValue: mockCloudStorageService,
        },
      ],
    }).compile();

    service = module.get<EducationProfileService>(EducationProfileService);
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);
    cloudStorageService = module.get(CloudStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateEducation', () => {
    it('should update education successfully', async () => {
      const updatedProfile = { ...mockProfile, education: mockEducationData };
      prismaService.profile.update.mockResolvedValue(updatedProfile);
      auditService.logProfileUpdate.mockResolvedValue(undefined);

      const result = await service.updateEducation(
        mockUserId,
        mockEducationData,
      );

      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Education updated successfully');
      expect(result.data).toEqual(mockEducationData);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { education: mockEducationData },
        select: { education: true },
      });
      expect(auditService.logProfileUpdate).toHaveBeenCalledWith(
        mockUserId,
        { education: mockEducationData },
        {
          operation: 'education_update',
          fieldsUpdated: ['education'],
        },
      );
    });

    it('should throw BadRequestException for invalid degree', async () => {
      const invalidEducation = { ...mockEducationData, degree: 'A' };

      await expect(
        service.updateEducation(mockUserId, invalidEducation),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateEducation(mockUserId, invalidEducation),
      ).rejects.toThrow('Degree must be at least 2 characters long');
    });

    it('should throw BadRequestException for invalid institution', async () => {
      const invalidEducation = { ...mockEducationData, institution: 'B' };

      await expect(
        service.updateEducation(mockUserId, invalidEducation),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateEducation(mockUserId, invalidEducation),
      ).rejects.toThrow('Institution must be at least 2 characters long');
    });

    it('should throw BadRequestException for invalid graduation year', async () => {
      const invalidEducation = { ...mockEducationData, graduationYear: 1800 };

      await expect(
        service.updateEducation(mockUserId, invalidEducation),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateEducation(mockUserId, invalidEducation),
      ).rejects.toThrow('Graduation year must be between 1900 and');
    });

    it('should handle Prisma P2025 error', async () => {
      prismaService.profile.update.mockResolvedValue(null);

      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow('Profile not found');
    });

    it('should handle Prisma P2002 error', async () => {
      prismaService.profile.update.mockResolvedValue(null);

      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow('Profile not found');
    });

    it('should handle unknown Prisma error', async () => {
      prismaService.profile.update.mockResolvedValue(null);

      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow('Profile not found');
    });

    it('should handle profile not found', async () => {
      prismaService.profile.update.mockResolvedValue(null);

      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEducation(mockUserId, mockEducationData),
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('addCertification', () => {
    beforeEach(() => {
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue(mockProfile);
      auditService.logProfileUpdate.mockResolvedValue(undefined);
    });

    it('should add certification without file successfully', async () => {
      const result = await service.addCertification(
        mockUserId,
        mockCertificationData,
      );

      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Certification added successfully');
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name', mockCertificationData.name);
      expect(result.data).toHaveProperty(
        'issuer',
        mockCertificationData.issuer,
      );
      expect(result.data).toHaveProperty('uploadedAt');
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(auditService.logProfileUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          certificationAdded: expect.objectContaining({
            name: mockCertificationData.name,
          }),
        },
        {
          operation: 'certification_added',
          fieldsUpdated: ['education.certifications'],
        },
      );
    });

    it('should add certification with file successfully', async () => {
      const mockUploadResult = {
        fileUrl: './uploads/certifications/test.pdf',
        fileName: mockFile.originalname,
        fileSize: mockFile.size,
      };
      cloudStorageService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await service.addCertification(
        mockUserId,
        mockCertificationData,
        mockFile,
      );

      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Certification added successfully');
      expect(result.data).toHaveProperty('fileUrl');
      expect(result.data).toHaveProperty('fileName', mockFile.originalname);
      expect(result.data).toHaveProperty('fileSize', mockFile.size);
      expect(cloudStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.stringContaining(mockUserId),
        'certifications',
      );
    });

    it('should throw BadRequestException for invalid certification name', async () => {
      const invalidCertification = { ...mockCertificationData, name: 'A' };

      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(
        'Certification name must be at least 2 characters long',
      );
    });

    it('should throw BadRequestException for invalid issuer', async () => {
      const invalidCertification = { ...mockCertificationData, issuer: 'B' };

      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow('Issuer must be at least 2 characters long');
    });

    it('should throw BadRequestException for missing date obtained', async () => {
      const invalidCertification = {
        ...mockCertificationData,
        dateObtained: undefined,
      };

      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow('Date obtained is required');
    });

    it('should throw BadRequestException for future date obtained', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const invalidCertification = {
        ...mockCertificationData,
        dateObtained: futureDate.toISOString(),
      };

      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow('Date obtained cannot be in the future');
    });

    it('should throw BadRequestException for invalid expiry date', async () => {
      const invalidCertification = {
        ...mockCertificationData,
        expiryDate: '2022-01-15', // Before date obtained
      };

      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow('Expiry date must be after date obtained');
    });

    it('should throw BadRequestException for invalid credential ID', async () => {
      const invalidCertification = {
        ...mockCertificationData,
        credentialId: 'AB',
      };

      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addCertification(mockUserId, invalidCertification),
      ).rejects.toThrow('Credential ID must be at least 3 characters long');
    });

    it('should handle file upload errors gracefully', async () => {
      cloudStorageService.uploadFile.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        service.addCertification(mockUserId, mockCertificationData, mockFile),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.addCertification(mockUserId, mockCertificationData, mockFile),
      ).rejects.toThrow('Database operation failed: certification addition');
    });

    it('should throw NotFoundException when profile not found', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.addCertification(mockUserId, mockCertificationData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.addCertification(mockUserId, mockCertificationData),
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('removeCertification', () => {
    beforeEach(() => {
      // Reset mock data to ensure clean state
      const cleanMockProfile = {
        id: 'profile-123',
        userId: mockUserId,
        education: {
          degree: "Bachelor's in Computer Science",
          institution: 'MIT',
          graduationYear: 2020,
          certifications: [mockCertificationWithFile],
        },
      };
      prismaService.profile.findUnique.mockResolvedValue(cleanMockProfile);
      prismaService.profile.update.mockResolvedValue(cleanMockProfile);
      auditService.logProfileUpdate.mockResolvedValue(undefined);
    });

    it('should remove certification successfully', async () => {
      cloudStorageService.deleteFile.mockResolvedValue(undefined);

      const result = await service.removeCertification(
        mockUserId,
        mockCertificationId,
      );

      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Certification removed successfully');
      expect(result.data).toEqual({ removedId: mockCertificationId });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(cloudStorageService.deleteFile).toHaveBeenCalledWith(
        mockCertificationWithFile.fileUrl,
      );
      expect(auditService.logProfileUpdate).toHaveBeenCalledWith(
        mockUserId,
        { certificationRemoved: mockCertificationWithFile },
        {
          operation: 'certification_removed',
          fieldsUpdated: ['education.certifications'],
        },
      );
    });

    it('should throw NotFoundException when profile not found', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.removeCertification(mockUserId, mockCertificationId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeCertification(mockUserId, mockCertificationId),
      ).rejects.toThrow('Profile not found');
    });

    it('should throw NotFoundException when certification not found', async () => {
      const profileWithoutCertifications = {
        ...mockProfile,
        education: { ...mockProfile.education, certifications: [] },
      };
      prismaService.profile.findUnique.mockResolvedValue(
        profileWithoutCertifications,
      );

      await expect(
        service.removeCertification(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeCertification(mockUserId, 'non-existent-id'),
      ).rejects.toThrow('Certification not found');
    });
  });

  describe('getEducation', () => {
    it('should get education successfully', async () => {
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getEducation(mockUserId);

      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Education retrieved successfully');
      expect(result.data).toEqual(mockProfile.education);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: { education: true },
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.getEducation(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getEducation(mockUserId)).rejects.toThrow(
        'Profile not found',
      );
    });
  });

  describe('downloadCertificationFile', () => {
    beforeEach(() => {
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      // Mock fs.promises.access to succeed
      jest.spyOn(require('fs').promises, 'access').mockResolvedValue(undefined);
    });

    it('should return file path and name successfully', async () => {
      const result = await service.downloadCertificationFile(
        mockUserId,
        mockCertificationId,
      );

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileName', 'aws-certification.pdf');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: { education: true },
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.downloadCertificationFile(mockUserId, mockCertificationId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.downloadCertificationFile(mockUserId, mockCertificationId),
      ).rejects.toThrow('Profile not found');
    });

    it('should throw NotFoundException when certification not found', async () => {
      const profileWithoutCertifications = {
        ...mockProfile,
        education: { ...mockProfile.education, certifications: [] },
      };
      prismaService.profile.findUnique.mockResolvedValue(
        profileWithoutCertifications,
      );

      await expect(
        service.downloadCertificationFile(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.downloadCertificationFile(mockUserId, 'non-existent-id'),
      ).rejects.toThrow('Certification not found');
    });

    it('should throw BadRequestException when no file associated', async () => {
      const certificationWithoutFile = {
        ...mockCertificationWithFile,
        fileUrl: undefined,
      };
      const profileWithCertificationWithoutFile = {
        ...mockProfile,
        education: {
          ...mockProfile.education,
          certifications: [certificationWithoutFile],
        },
      };
      prismaService.profile.findUnique.mockResolvedValue(
        profileWithCertificationWithoutFile,
      );

      await expect(
        service.downloadCertificationFile(mockUserId, mockCertificationId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.downloadCertificationFile(mockUserId, mockCertificationId),
      ).rejects.toThrow('No file associated with this certification');
    });
  });
});
