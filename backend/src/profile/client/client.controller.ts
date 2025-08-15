import {
  Controller,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CompanyInfoDto } from '../dto/update-client-profile.dto/company-info.dto';
import { BillingAddressDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { ProjectPreferencesDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Profile, UserRole } from '@prisma/client';
import { SocialLinksDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { AuthGuardWithRoles } from 'src/auth/guards/auth.guard';

@ApiTags('User Management')
@ApiBearerAuth('JWT-auth') // Indicates that JWT Bearer token is required
@Controller('profile')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Patch('company')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Update client company information' })
  @ApiResponse({ status: 200, description: 'Company info successfully updated', type: CompanyInfoDto })
  @ApiResponse({ status: 403, description: 'Forbidden. Only clients can update company info' })
  async updateCompany(@Req() req, @Body() dto: CompanyInfoDto) {
    const userId = req.user.id;
    return await this.clientService.updateCompanyInfo(userId, dto);
  }

  @Patch('billing')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Update client billing address' })
  @ApiResponse({ status: 200, description: 'Billing address successfully updated', type: BillingAddressDto })
  @ApiResponse({ status: 403, description: 'Forbidden. Only clients can update billing address' })
  async updateBillingAddress(@Req() req, @Body() dto: BillingAddressDto) {
    const userId = req.user.id;
    return await this.clientService.updateBillingAddress(userId, dto);
  }

  @Patch('project-preferences')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Update client project preferences' })
  @ApiResponse({ status: 200, description: 'Project preferences successfully updated', type: ProjectPreferencesDto })
  @ApiResponse({ status: 403, description: 'Forbidden. Only clients can update project preferences' })
  async updateProjectPreferences(@Req() req, @Body() dto: ProjectPreferencesDto) {
    const userId = req.user.id; // assuming JwtAuthGuard attaches user to req
    const updatedProfile = await this.clientService.updateProjectPreferences(userId, dto);
    return updatedProfile;
  }

  @Patch('client-social')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Update client social links' })
  @ApiResponse({ status: 200, description: 'Social links successfully updated', type: SocialLinksDto })
  @ApiResponse({ status: 403, description: 'Forbidden. Only clients can update social links' })
  async updateClientSocialLinks(@Req() req, @Body() dto: SocialLinksDto) {
    const userId = req.user.id; // JwtAuthGuard attaches user to req
    const updatedProfile = await this.clientService.updateClientSocialLinks(userId, dto);
    return updatedProfile;
  }
}

