import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getThrottleOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const endpoint = request.route?.path || '';

    // File upload operations (more restrictive due to resource usage)
    if (
      endpoint.includes('/education/certifications') &&
      request.method === 'POST'
    ) {
      return { ttl: 60000, limit: 5 }; // 5 requests per minute for file uploads
    }

    // File download operations
    if (
      endpoint.includes('/education/certifications') &&
      endpoint.includes('/download')
    ) {
      return { ttl: 60000, limit: 10 }; // 10 requests per minute for file downloads
    }

    // Different rate limits for different operations
    if (endpoint.includes('/profile/developer')) {
      return { ttl: 60000, limit: 10 }; // 10 requests per minute for developer profile updates
    }

    if (endpoint.includes('/profile/client')) {
      return { ttl: 60000, limit: 10 }; // 10 requests per minute for client profile updates
    }

    if (endpoint.includes('/profile/admin')) {
      return { ttl: 60000, limit: 5 }; // 5 requests per minute for admin profile updates (more restrictive)
    }

    if (endpoint.includes('/profile') && request.method === 'PATCH') {
      return { ttl: 60000, limit: 15 }; // 15 requests per minute for basic profile updates
    }

    // Default rate limit for other operations
    return { ttl: 60000, limit: 30 }; // 30 requests per minute for read operations
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Use user ID as the key for rate limiting
    const key = user?.userId || request.ip;

    // Check if user has exceeded the rate limit
    const { success } = await this.throttlerService.check(key, limit, ttl);

    if (!success) {
      const response = context.switchToHttp().getResponse();
      response.status(429).json({
        statusCode: 429,
        message: `Rate limit exceeded. Please wait before making another request.`,
        retryAfter: Math.ceil(ttl / 1000),
      });
      return false;
    }

    return true;
  }
}
