import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioLinkDto, PortfolioLinksDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '.prisma/client/wasm';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('User Management')
@ApiBearerAuth('JWT-auth')
@Controller('profile/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  
  @Get()
 @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Get portfolio links' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  async getPortfolioLinks(@Query('userId') userId: string): Promise<PortfolioLinksDto> {
    return this.portfolioService.getPortfolioLinks(userId);
  }

  
  @Post('custom')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Add custom link' })
  @ApiResponse({ status: 201, type: PortfolioLinksDto })
  async addCustomLink(
    @Query('userId') userId: string,
    @Body() link: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.addCustomLink(userId, link);
  }


  @Patch('custom/:label')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update custom link' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  async updateCustomLink(
    @Query('userId') userId: string,
    @Param('label') label: string,
    @Body() updatedLink: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.updateCustomLink(userId, label, updatedLink);
  }

  
  
  @Delete('custom/:label')
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Remove custom link' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  async removeCustomLink(
    @Query('userId') userId: string,
    @Param('label') label: string,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.removeCustomLink(userId, label);
    }
}
