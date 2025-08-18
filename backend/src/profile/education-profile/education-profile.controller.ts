import {
  Controller,
  Put,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EducationProfileService } from './education-profile.service';
import {
  EducationDto,
  CertificationDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { RateLimitGuard } from '../guards/rate-limit.guard';

@ApiTags('Education & Certifications')
@Controller('profile/education')
@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.DEVELOPER)
export class EducationProfileController {
  constructor(
    private readonly educationProfileService: EducationProfileService,
  ) {}

  @Put()
  @ApiOperation({
    summary: 'Update education information',
    description:
      'Update education details for the authenticated developer user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: EducationDto })
  @ApiOkResponse({
    description: 'Education updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Education updated successfully' },
        data: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid education data provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  async updateEducation(@Req() req: any, @Body() educationData: EducationDto) {
    return this.educationProfileService.updateEducation(
      req.user.userId,
      educationData,
    );
  }

  @Post('certifications')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Add certification with optional file upload',
    description:
      'Add a new certification for the authenticated developer user with optional file attachment. Rate limited to 5 requests per minute.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'AWS Certified Solutions Architect' },
        issuer: { type: 'string', example: 'Amazon' },
        dateObtained: { type: 'string', example: '2023-01-15' },
        expiryDate: { type: 'string', example: '2025-01-15', nullable: true },
        credentialId: {
          type: 'string',
          example: '12345-abcde',
          nullable: true,
        },
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Certification file (PDF, JPG, PNG, DOC, DOCX) - Max 10MB',
        },
      },
      required: ['name', 'issuer', 'dateObtained'],
    },
  })
  @ApiCreatedResponse({
    description: 'Certification added successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Certification added successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid certification data or file',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many file upload requests',
  })
  @UseInterceptors(FileInterceptor('file'))
  async addCertification(
    @Req() req: any,
    @Body() certificationData: CertificationDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(pdf|jpg|jpeg|png|doc|docx)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: any,
  ) {
    return this.educationProfileService.addCertification(
      req.user.userId,
      certificationData,
      file,
    );
  }

  @Delete('certifications/:id')
  @ApiOperation({
    summary: 'Remove certification',
    description:
      'Remove a certification by ID for the authenticated developer user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Certification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Certification removed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Certification removed successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid certification ID',
  })
  @ApiNotFoundResponse({
    description: 'Certification not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  async removeCertification(
    @Req() req: any,
    @Param('id') certificationId: string,
  ) {
    return this.educationProfileService.removeCertification(
      req.user.userId,
      certificationId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get education information',
    description:
      'Get complete education information for the authenticated developer user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Education information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Education retrieved successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  async getEducation(@Req() req: any) {
    return this.educationProfileService.getEducation(req.user.userId);
  }

  @Get('certifications/:id/download')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Download certification file',
    description:
      'Download the file associated with a certification. Rate limited to 10 requests per minute.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Certification ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'File downloaded successfully',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Certification or file not found',
  })
  @ApiBadRequestResponse({
    description: 'No file associated with certification',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Developer role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many download requests',
  })
  async downloadCertificationFile(
    @Req() req: any,
    @Param('id') certificationId: string,
    @Res() res: Response,
  ) {
    const { filePath, fileName } =
      await this.educationProfileService.downloadCertificationFile(
        req.user.userId,
        certificationId,
      );

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = createReadStream(filePath);

    // Add error handling for file stream
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          statusCode: 500,
          message: 'Failed to read file',
          error: 'Internal Server Error',
        });
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      fileStream.destroy();
    });

    fileStream.pipe(res);
  }
}
