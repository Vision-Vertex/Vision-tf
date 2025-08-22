import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Maximum number of sessions allowed per user (total across all devices)
   */
  get maxSessionsPerUser(): number {
    return parseInt(this.configService.get('MAX_SESSIONS_PER_USER') || '4', 10);
  }

  /**
   * Maximum number of sessions allowed per device
   */
  get maxSessionsPerDevice(): number {
    return parseInt(this.configService.get('MAX_SESSIONS_PER_DEVICE') || '2', 10);
  }

  /**
   * Maximum number of unique devices allowed per user
   */
  get maxDevicesPerUser(): number {
    return parseInt(this.configService.get('MAX_DEVICES_PER_USER') || '3', 10);
  }

  /**
   * Session cleanup interval in milliseconds
   */
  get sessionCleanupInterval(): number {
    return parseInt(
      this.configService.get('SESSION_CLEANUP_INTERVAL') || '3600000',
      10,
    );
  }

  /**
   * Session extension threshold in milliseconds (when to extend session before expiry)
   */
  get sessionExtensionThreshold(): number {
    return parseInt(
      this.configService.get('SESSION_EXTENSION_THRESHOLD') || '1800000',
      10,
    );
  }

  /**
   * Regular session duration in milliseconds
   */
  get sessionExpires(): number {
    const expires = this.configService.get('SESSION_EXPIRES') || '24h';
    return this.parseDuration(expires);
  }

  /**
   * Remember me session duration in milliseconds
   */
  get rememberMeExpires(): number {
    const expires = this.configService.get('REMEMBER_ME_EXPIRES') || '30d';
    return this.parseDuration(expires);
  }

  /**
   * Session secret for additional security
   */
  get sessionSecret(): string {
    return this.configService.get('SESSION_SECRET') || 'default-session-secret';
  }

  /**
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value * 1000; // seconds
      case 'm':
        return value * 60 * 1000; // minutes
      case 'h':
        return value * 60 * 60 * 1000; // hours
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days
      default:
        return 24 * 60 * 60 * 1000; // default 24 hours
    }
  }
}
