import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import {
  PortfolioLinkDto,
  PortfolioLinksDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('User Profiles')
@ApiBearerAuth()
@Controller('profile/portfolio')
@UseGuards(AuthGuardWithRoles)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Get portfolio links' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  async getPortfolioLinks(@Req() req: any): Promise<PortfolioLinksDto> {
    return this.portfolioService.getPortfolioLinks(req.user.userId);
  }

  @Post('custom')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Add custom link' })
  @ApiResponse({ status: 201, type: PortfolioLinksDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  async addCustomLink(
    @Req() req: any,
    @Body() link: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.addCustomLink(req.user.userId, link);
  }

  @Patch('custom/:label')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update custom link' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  async updateCustomLink(
    @Req() req: any,
    @Param('label') label: string,
    @Body() updatedLink: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.updateCustomLink(
      req.user.userId,
      label,
      updatedLink,
    );
  }

  @Delete('custom/:label')
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Remove custom link' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT token required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Developer role required' })
  async removeCustomLink(
    @Req() req: any,
    @Param('label') label: string,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.removeCustomLink(req.user.userId, label);
  }
}
