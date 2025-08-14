import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Profile } from '@prisma/client';
import { PortfolioLinkDto, PortfolioLinksDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  private validateUrl(url: string): void {
    const urlPattern = new RegExp(
      '^(https?:\\/\\/)' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      'localhost|' +
      '\\d{1,3}(\\.\\d{1,3}){3})' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$','i'
    );
    if (!urlPattern.test(url)) {
      throw new BadRequestException(`Invalid URL format: ${url}`);
    }
  }

  private findCustomLinkIndex(links: PortfolioLinkDto[] = [], label: string): number {
    return links.findIndex(l => l.label.toLowerCase() === label.toLowerCase());
  }

  async getPortfolioLinks(userId: string): Promise<PortfolioLinksDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { portfolioLinks: true },
    });

    return (profile?.portfolioLinks as PortfolioLinksDto) || {};
  }

  async addCustomLink(userId: string, link: PortfolioLinkDto): Promise<PortfolioLinksDto> {
    this.validateUrl(link.url);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { portfolioLinks: true },
    });

    const portfolioLinks: PortfolioLinksDto = (profile?.portfolioLinks as PortfolioLinksDto) || {};
    const customLinks = portfolioLinks.customLinks || [];

    if (this.findCustomLinkIndex(customLinks, link.label) !== -1) {
      throw new BadRequestException(`Custom link with label '${link.label}' already exists.`);
    }

    const updatedLinks: PortfolioLinksDto = {
      ...portfolioLinks,
      customLinks: [...customLinks, link],
    };

    await this.prisma.profile.update({
      where: { userId },
      data: { portfolioLinks: instanceToPlain(updatedLinks)  },
    });

    return updatedLinks;
  }

  async updateCustomLink(userId: string, label: string, updatedLink: PortfolioLinkDto): Promise<PortfolioLinksDto> {
    this.validateUrl(updatedLink.url);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { portfolioLinks: true },
    });

    if (!profile?.portfolioLinks) {
      throw new NotFoundException(`No portfolio links found for user.`);
    }

    const portfolioLinks: PortfolioLinksDto = profile.portfolioLinks as PortfolioLinksDto;
    const customLinks = portfolioLinks.customLinks || [];

    const index = this.findCustomLinkIndex(customLinks, label);
    if (index === -1) {
      throw new NotFoundException(`Custom link with label '${label}' not found.`);
    }

    if (
      updatedLink.label.toLowerCase() !== label.toLowerCase() &&
      this.findCustomLinkIndex(customLinks, updatedLink.label) !== -1
    ) {
      throw new BadRequestException(`Custom link with label '${updatedLink.label}' already exists.`);
    }

    customLinks[index] = updatedLink;

    const updatedLinks: PortfolioLinksDto = { ...portfolioLinks, customLinks };

    await this.prisma.profile.update({
      where: { userId },
      data: { portfolioLinks:instanceToPlain(updatedLinks) },
    });

    return updatedLinks;
  }

  async removeCustomLink(userId: string, label: string): Promise<PortfolioLinksDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { portfolioLinks: true },
    });

    if (!profile?.portfolioLinks) {
      throw new NotFoundException(`No portfolio links found for user.`);
    }

    const portfolioLinks: PortfolioLinksDto = profile.portfolioLinks as PortfolioLinksDto;
    const customLinks = portfolioLinks.customLinks || [];

    const index = this.findCustomLinkIndex(customLinks, label);
    if (index === -1) {
      throw new NotFoundException(`Custom link with label '${label}' not found.`);
    }

    customLinks.splice(index, 1);

    const updatedLinks: PortfolioLinksDto = { ...portfolioLinks, customLinks };

    await this.prisma.profile.update({
      where: { userId },
      data: { portfolioLinks: instanceToPlain(updatedLinks)  },
    });

    return updatedLinks;
  }
}
