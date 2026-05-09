import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../middleware/jwt.middleware';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    this.logger.debug(
      `Checking roles — required: [${requiredRoles}] | user: ${user?.email} | role in token: "${user?.role}"`,
    );

    if (!user || !requiredRoles.includes(user.role)) {
      this.logger.warn(
        `Access denied — user "${user?.email}" has role "${user?.role}" but needs [${requiredRoles}]`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
