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

@ApiTags('Portfolio')
@ApiBearerAuth()
@Controller('profile/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  
  @Get()
  @ApiOperation({ summary: 'Get portfolio links' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  async getPortfolioLinks(@Query('userId') userId: string): Promise<PortfolioLinksDto> {
    return this.portfolioService.getPortfolioLinks(userId);
  }

  
  @Post('custom')
  @ApiOperation({ summary: 'Add custom link' })
  @ApiResponse({ status: 201, type: PortfolioLinksDto })
  async addCustomLink(
    @Query('userId') userId: string,
    @Body() link: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.addCustomLink(userId, link);
  }


  @Patch('custom/:label')
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
  @ApiOperation({ summary: 'Remove custom link' })
  @ApiResponse({ status: 200, type: PortfolioLinksDto })
  async removeCustomLink(
    @Query('userId') userId: string,
    @Param('label') label: string,
  ): Promise<PortfolioLinksDto> {
    return this.portfolioService.removeCustomLink(userId, label);
    }
}
