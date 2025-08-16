import { Test, TestingModule } from '@nestjs/testing';
import { EducationProfileController } from './education-profile.controller';
import { EducationProfileService } from './education-profile.service';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import {
  EducationDto,
  CertificationDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { SuccessResponse } from '../../common/dto/api-response.dto';

describe('EducationProfileController', () => {
  let controller: EducationProfileController;
  let educationProfileService: jest.Mocked<EducationProfileService>;

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

  const mockReq = {
    user: { userId: mockUserId },
    on: jest.fn(),
  };

  beforeEach(async () => {
    const mockEducationProfileService = {
      updateEducation: jest.fn(),
      addCertification: jest.fn(),
      removeCertification: jest.fn(),
      getEducation: jest.fn(),
      downloadCertificationFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EducationProfileController],
      providers: [
        {
          provide: EducationProfileService,
          useValue: mockEducationProfileService,
        },
        {
          provide: 'THROTTLER:MODULE_OPTIONS',
          useValue: { ttl: 60000, limit: 30 },
        },
        {
          provide: 'ThrottlerStorage',
          useValue: {
            increment: jest
              .fn()
              .mockResolvedValue({ totalHits: 1, timeToExpire: 60000 }),
            reset: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RateLimitGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<EducationProfileController>(
      EducationProfileController,
    );
    educationProfileService = module.get(EducationProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateEducation', () => {
    it('should update education successfully', async () => {
      const mockResponse = new SuccessResponse(
        'Education updated successfully',
        mockEducationData,
      );
      educationProfileService.updateEducation.mockResolvedValue(mockResponse);

      const result = await controller.updateEducation(
        mockReq,
        mockEducationData,
      );

      expect(result).toBe(mockResponse);
      expect(educationProfileService.updateEducation).toHaveBeenCalledWith(
        mockUserId,
        mockEducationData,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      educationProfileService.updateEducation.mockRejectedValue(error);

      await expect(
        controller.updateEducation(mockReq, mockEducationData),
      ).rejects.toThrow('Service error');
      expect(educationProfileService.updateEducation).toHaveBeenCalledWith(
        mockUserId,
        mockEducationData,
      );
    });
  });

  describe('addCertification', () => {
    it('should add certification without file successfully', async () => {
      const mockResponse = new SuccessResponse(
        'Certification added successfully',
        mockCertificationData,
      );
      educationProfileService.addCertification.mockResolvedValue(mockResponse);

      const result = await controller.addCertification(
        mockReq,
        mockCertificationData,
      );

      expect(result).toBe(mockResponse);
      expect(educationProfileService.addCertification).toHaveBeenCalledWith(
        mockUserId,
        mockCertificationData,
        undefined,
      );
    });

    it('should add certification with file successfully', async () => {
      const mockResponse = new SuccessResponse(
        'Certification added successfully',
        {
          ...mockCertificationData,
          fileUrl: './uploads/certifications/test.pdf',
          fileName: mockFile.originalname,
          fileSize: mockFile.size,
        },
      );
      educationProfileService.addCertification.mockResolvedValue(mockResponse);

      const result = await controller.addCertification(
        mockReq,
        mockCertificationData,
        mockFile,
      );

      expect(result).toBe(mockResponse);
      expect(educationProfileService.addCertification).toHaveBeenCalledWith(
        mockUserId,
        mockCertificationData,
        mockFile,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      educationProfileService.addCertification.mockRejectedValue(error);

      await expect(
        controller.addCertification(mockReq, mockCertificationData),
      ).rejects.toThrow('Service error');
      expect(educationProfileService.addCertification).toHaveBeenCalledWith(
        mockUserId,
        mockCertificationData,
        undefined,
      );
    });
  });

  describe('removeCertification', () => {
    it('should remove certification successfully', async () => {
      const mockResponse = new SuccessResponse(
        'Certification removed successfully',
        { removedId: mockCertificationId },
      );
      educationProfileService.removeCertification.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.removeCertification(
        mockReq,
        mockCertificationId,
      );

      expect(result).toBe(mockResponse);
      expect(educationProfileService.removeCertification).toHaveBeenCalledWith(
        mockUserId,
        mockCertificationId,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      educationProfileService.removeCertification.mockRejectedValue(error);

      await expect(
        controller.removeCertification(mockReq, mockCertificationId),
      ).rejects.toThrow('Service error');
      expect(educationProfileService.removeCertification).toHaveBeenCalledWith(
        mockUserId,
        mockCertificationId,
      );
    });
  });

  describe('getEducation', () => {
    it('should get education successfully', async () => {
      const mockResponse = new SuccessResponse(
        'Education retrieved successfully',
        mockEducationData,
      );
      educationProfileService.getEducation.mockResolvedValue(mockResponse);

      const result = await controller.getEducation(mockReq);

      expect(result).toBe(mockResponse);
      expect(educationProfileService.getEducation).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      educationProfileService.getEducation.mockRejectedValue(error);

      await expect(controller.getEducation(mockReq)).rejects.toThrow(
        'Service error',
      );
      expect(educationProfileService.getEducation).toHaveBeenCalledWith(
        mockUserId,
      );
    });
  });

  describe('downloadCertificationFile', () => {
    it('should download certification file successfully', async () => {
      const mockFileInfo = {
        filePath: './uploads/certifications/test.pdf',
        fileName: 'test-certification.pdf',
      };
      educationProfileService.downloadCertificationFile.mockResolvedValue(
        mockFileInfo,
      );

      const mockRes = {
        setHeader: jest.fn(),
      } as any;

      const mockFileStream = {
        pipe: jest.fn(),
        on: jest.fn(),
      };
      jest
        .spyOn(require('fs'), 'createReadStream')
        .mockReturnValue(mockFileStream);

      await controller.downloadCertificationFile(
        mockReq,
        mockCertificationId,
        mockRes,
      );

      expect(
        educationProfileService.downloadCertificationFile,
      ).toHaveBeenCalledWith(mockUserId, mockCertificationId);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test-certification.pdf"',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/octet-stream',
      );
      expect(mockFileStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      educationProfileService.downloadCertificationFile.mockRejectedValue(
        error,
      );

      const mockRes = {
        setHeader: jest.fn(),
      } as any;

      await expect(
        controller.downloadCertificationFile(
          mockReq,
          mockCertificationId,
          mockRes,
        ),
      ).rejects.toThrow('Service error');
      expect(
        educationProfileService.downloadCertificationFile,
      ).toHaveBeenCalledWith(mockUserId, mockCertificationId);
    });
  });

  describe('Controller Decorators', () => {
    it('should have correct controller decorators', () => {
      const controllerMetadata = Reflect.getMetadata(
        'path',
        EducationProfileController,
      );
      expect(controllerMetadata).toBe('profile/education');
    });

    it('should have correct guards', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        EducationProfileController,
      );
      expect(guards).toContain(AuthGuardWithRoles);
    });

    it('should have correct roles decorator', () => {
      const roles = Reflect.getMetadata('roles', EducationProfileController);
      expect(roles).toEqual([UserRole.DEVELOPER]);
    });
  });
});
