import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Profile } from '@prisma/client';
import {
  PortfolioLinkDto,
  PortfolioLinksDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  // Cache compiled regex for better performance
  private readonly urlPattern = new RegExp(
    '^(https?:\\/\\/)' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      'localhost|' +
      '\\d{1,3}(\\.\\d{1,3}){3})' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$',
    'i',
  );

  constructor(private readonly prisma: PrismaService) {}

  private validateUrl(url: string): void {
    if (!this.urlPattern.test(url)) {
      throw new BadRequestException({
        message: 'Invalid URL format',
        error: 'INVALID_URL',
        details: { url },
      });
    }
  }

  private sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException({
        message: 'Input must be a valid string',
        error: 'INVALID_INPUT',
      });
    }

    const sanitized = input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 100); // Limit length

    if (sanitized.length === 0) {
      throw new BadRequestException({
        message: 'Input cannot be empty after sanitization',
        error: 'EMPTY_INPUT',
      });
    }

    return sanitized;
  }

  private validatePortfolioLink(link: PortfolioLinkDto): void {
    if (!link.label || !link.url) {
      throw new BadRequestException({
        message: 'Label and URL are required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    // Sanitize inputs
    link.label = this.sanitizeInput(link.label);
    link.url = this.sanitizeInput(link.url);
    if (link.description) {
      link.description = this.sanitizeInput(link.description);
    }

    // Validate URL
    this.validateUrl(link.url);

    // Validate label length
    if (link.label.length > 50) {
      throw new BadRequestException({
        message: 'Label too long (max 50 characters)',
        error: 'LABEL_TOO_LONG',
        details: { maxLength: 50, currentLength: link.label.length },
      });
    }
  }

  async getPortfolioLinks(userId: string): Promise<PortfolioLinksDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { portfolioLinks: true },
    });

    return (profile?.portfolioLinks as PortfolioLinksDto) || {};
  }

  async addCustomLink(
    userId: string,
    link: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    this.validatePortfolioLink(link);

    try {
      // Get current portfolio links
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { portfolioLinks: true },
      });

      const portfolioLinks: PortfolioLinksDto =
        (profile?.portfolioLinks as PortfolioLinksDto) || {};
      const customLinks = portfolioLinks.customLinks || [];

      // Check for duplicate label
      const existingLink = customLinks.find(
        (l) => l.label.toLowerCase() === link.label.toLowerCase(),
      );
      if (existingLink) {
        throw new BadRequestException({
          message: `Custom link with label '${link.label}' already exists`,
          error: 'DUPLICATE_LABEL',
          details: { label: link.label },
        });
      }

      // Add new link
      const updatedLinks: PortfolioLinksDto = {
        ...portfolioLinks,
        customLinks: [...customLinks, link],
      };

      // Single database operation
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { portfolioLinks: updatedLinks },
        select: { portfolioLinks: true },
      });

      return result.portfolioLinks as PortfolioLinksDto;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  async updateCustomLink(
    userId: string,
    label: string,
    updatedLink: PortfolioLinkDto,
  ): Promise<PortfolioLinksDto> {
    this.validatePortfolioLink(updatedLink);
    const sanitizedLabel = this.sanitizeInput(label);

    try {
      // Get current portfolio links
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { portfolioLinks: true },
      });

      if (!profile?.portfolioLinks) {
        throw new NotFoundException({
          message: 'No portfolio links found for user',
          error: 'NO_PORTFOLIO_LINKS',
        });
      }

      const portfolioLinks = profile.portfolioLinks as PortfolioLinksDto;
      const customLinks = portfolioLinks.customLinks || [];

      // Find the link to update
      const linkIndex = customLinks.findIndex(
        (l) => l.label.toLowerCase() === sanitizedLabel.toLowerCase(),
      );

      if (linkIndex === -1) {
        throw new NotFoundException({
          message: `Custom link with label '${sanitizedLabel}' not found`,
          error: 'LINK_NOT_FOUND',
          details: { label: sanitizedLabel },
        });
      }

      // Check for label conflicts (if label is being changed)
      if (updatedLink.label.toLowerCase() !== sanitizedLabel.toLowerCase()) {
        const existingLink = customLinks.find(
          (l) => l.label.toLowerCase() === updatedLink.label.toLowerCase(),
        );
        if (existingLink) {
          throw new BadRequestException({
            message: `Custom link with label '${updatedLink.label}' already exists`,
            error: 'DUPLICATE_LABEL',
            details: { label: updatedLink.label },
          });
        }
      }

      // Update the link
      customLinks[linkIndex] = updatedLink;

      // Single database operation
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { portfolioLinks },
        select: { portfolioLinks: true },
      });

      return result.portfolioLinks as PortfolioLinksDto;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  async removeCustomLink(
    userId: string,
    label: string,
  ): Promise<PortfolioLinksDto> {
    const sanitizedLabel = this.sanitizeInput(label);

    try {
      // Get current portfolio links
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { portfolioLinks: true },
      });

      if (!profile?.portfolioLinks) {
        throw new NotFoundException({
          message: 'No portfolio links found for user',
          error: 'NO_PORTFOLIO_LINKS',
        });
      }

      const portfolioLinks = profile.portfolioLinks as PortfolioLinksDto;
      const customLinks = portfolioLinks.customLinks || [];

      // Check if link exists
      const linkExists = customLinks.some(
        (l) => l.label.toLowerCase() === sanitizedLabel.toLowerCase(),
      );

      if (!linkExists) {
        throw new NotFoundException({
          message: `Custom link with label '${sanitizedLabel}' not found`,
          error: 'LINK_NOT_FOUND',
          details: { label: sanitizedLabel },
        });
      }

      // Remove the link
      const updatedLinks: PortfolioLinksDto = {
        ...portfolioLinks,
        customLinks: customLinks.filter(
          (l) => l.label.toLowerCase() !== sanitizedLabel.toLowerCase(),
        ),
      };

      // Single database operation
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { portfolioLinks: updatedLinks },
        select: { portfolioLinks: true },
      });

      return result.portfolioLinks as PortfolioLinksDto;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }
      throw error;
    }
  }
}
