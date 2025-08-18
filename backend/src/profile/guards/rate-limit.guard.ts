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

  protected async handleRequest(request: any): Promise<boolean> {
    const user = request.user;

    // Use user ID as the key for rate limiting
    const key = user?.userId || request.ip;

    // Get throttle options for this request
    const options = this.getThrottleOptions({ switchToHttp: () => ({ getRequest: () => request }) } as any);

    // Check if user has exceeded the rate limit
    const { success } = await (this as any).throttlerService.check(key, options.limit, options.ttl);

    if (!success) {
      const response = request.res;
      response.status(429).json({
        statusCode: 429,
        message: `Rate limit exceeded. Please wait before making another request.`,
        retryAfter: Math.ceil(options.ttl / 1000),
      });
      return false;
    }

    return true;
  }
}
