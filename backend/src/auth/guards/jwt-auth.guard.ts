import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../session.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, try to authenticate with JWT
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Check if session exists and is valid
      const session = await this.sessionService.validateSession(
        payload.sessionToken,
      );
      if (!session) {
        throw new UnauthorizedException('Session is invalid or expired');
      }

      // Attach user and session to request
      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionToken: payload.sessionToken,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or session');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
