import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  isIncognito: boolean;
}

export interface DeviceFingerprintData {
  userAgent: string;
  ipAddress: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

@Injectable()
export class DeviceFingerprintService {
  /**
   * Creates a unique device fingerprint based on device characteristics
   */
  createFingerprint(data: DeviceFingerprintData): string {
    const deviceInfo = this.parseDeviceInfo(data.userAgent);
    
    // Create fingerprint components
    const components = [
      data.ipAddress,
      deviceInfo.browser,
      deviceInfo.browserVersion,
      deviceInfo.os,
      deviceInfo.osVersion,
      deviceInfo.device,
      deviceInfo.isIncognito ? 'incognito' : 'normal',
      data.screenResolution || '',
      data.timezone || '',
      data.language || '',
    ];

    // Create hash of components
    const fingerprint = createHash('sha256')
      .update(components.join('|'))
      .digest('hex');

    return fingerprint;
  }

  /**
   * Parses user agent to extract device information
   */
  parseDeviceInfo(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();
    
    // Detect browser
    let browser = 'Unknown';
    let browserVersion = '';
    
    if (ua.includes('chrome')) {
      browser = 'Chrome';
      browserVersion = this.extractVersion(ua, 'chrome/');
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
      browserVersion = this.extractVersion(ua, 'firefox/');
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
      browserVersion = this.extractVersion(ua, 'version/');
    } else if (ua.includes('edge')) {
      browser = 'Edge';
      browserVersion = this.extractVersion(ua, 'edge/');
    } else if (ua.includes('opera')) {
      browser = 'Opera';
      browserVersion = this.extractVersion(ua, 'opera/');
    }

    // Detect OS
    let os = 'Unknown';
    let osVersion = '';
    
    if (ua.includes('windows')) {
      os = 'Windows';
      osVersion = this.extractWindowsVersion(ua);
    } else if (ua.includes('mac os')) {
      os = 'macOS';
      osVersion = this.extractVersion(ua, 'mac os ');
    } else if (ua.includes('linux')) {
      os = 'Linux';
      osVersion = this.extractVersion(ua, 'linux ');
    } else if (ua.includes('android')) {
      os = 'Android';
      osVersion = this.extractVersion(ua, 'android ');
    } else if (ua.includes('ios')) {
      os = 'iOS';
      osVersion = this.extractVersion(ua, 'os ');
    }

    // Detect device type
    let device = 'Desktop';
    if (ua.includes('mobile')) {
      device = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = 'Tablet';
    }

    // Detect incognito/private mode
    const isIncognito = this.detectIncognito(userAgent);

    return {
      browser,
      browserVersion,
      os,
      osVersion,
      device,
      isIncognito,
    };
  }

  /**
   * Detects if the browser is in incognito/private mode
   */
  detectIncognito(userAgent: string): boolean {
    const ua = userAgent.toLowerCase();
    
    // Chrome incognito detection patterns
    if (ua.includes('chrome') && (
      ua.includes('incognito') ||
      ua.includes('private') ||
      ua.includes('headless')
    )) {
      return true;
    }
    
    // Firefox private browsing detection
    if (ua.includes('firefox') && ua.includes('private')) {
      return true;
    }
    
    // Safari private browsing detection
    if (ua.includes('safari') && ua.includes('private')) {
      return true;
    }
    
    // Edge InPrivate detection
    if (ua.includes('edge') && ua.includes('inprivate')) {
      return true;
    }
    
    return false;
  }

  /**
   * Extracts version number from user agent string
   */
  private extractVersion(userAgent: string, prefix: string): string {
    const index = userAgent.indexOf(prefix);
    if (index === -1) return '';
    
    const start = index + prefix.length;
    const end = userAgent.indexOf(' ', start);
    const version = end === -1 
      ? userAgent.substring(start)
      : userAgent.substring(start, end);
    
    return version.split('.')[0] || ''; // Return major version only
  }

  /**
   * Extracts Windows version from user agent
   */
  private extractWindowsVersion(userAgent: string): string {
    if (userAgent.includes('windows nt 10.0')) return '10';
    if (userAgent.includes('windows nt 6.3')) return '8.1';
    if (userAgent.includes('windows nt 6.2')) return '8';
    if (userAgent.includes('windows nt 6.1')) return '7';
    if (userAgent.includes('windows nt 6.0')) return 'Vista';
    if (userAgent.includes('windows nt 5.2')) return 'XP x64';
    if (userAgent.includes('windows nt 5.1')) return 'XP';
    if (userAgent.includes('windows nt 5.0')) return '2000';
    return '';
  }

  /**
   * Creates a human-readable device name
   */
  createDeviceName(deviceInfo: DeviceInfo): string {
    const parts = [
      deviceInfo.browser,
      deviceInfo.os,
      deviceInfo.device,
    ];
    
    if (deviceInfo.isIncognito) {
      parts.push('(Incognito)');
    }
    
    return parts.filter(Boolean).join(' - ');
  }
}












