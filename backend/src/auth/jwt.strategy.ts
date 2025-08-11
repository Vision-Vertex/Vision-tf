import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionService } from './session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private sessionService: SessionService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    // Check if payload exists and has session token
    if (!payload || !payload.sessionToken) {
      throw new UnauthorizedException('Session token missing from JWT payload');
    }

    // Validate session
    const session = await this.sessionService.validateSession(
      payload.sessionToken,
    );
    if (!session) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return {
      userId: payload?.sub,
      email: payload?.email,
      role: payload?.role,
      sessionToken: payload?.sessionToken,
    };
  }
}
