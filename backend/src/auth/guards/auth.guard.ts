import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SessionService } from '../session.service';

@Injectable()
export class AuthGuardWithRoles extends JwtAuthGuard {
  constructor(
    private reflector: Reflector,
    jwtService: JwtService,
    sessionService: SessionService,
  ) {
    super(jwtService, sessionService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, authenticate with JWT and validate session
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) {
      return false;
    }

    // Then check roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
