import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, ProviderApprovalStatus, UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUserContext } from '../decorators/current-user.decorator';
import { JwtAuthRepository } from '../repositories/jwt-auth.repository';

interface JwtPayload extends AuthUserContext {
  sub?: string;
  type?: string;
  permissions?: Prisma.JsonValue;
  guestSessionId?: string;
  capabilities?: string[];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly repository: JwtAuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUserContext }>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      });
      if (payload.role === UserRole.GUEST_USER) {
        const guestSession = await this.repository.findActiveGuestSessionForJwtGuard(payload.guestSessionId ?? payload.sub ?? payload.uid);
        if (!guestSession) throw new UnauthorizedException('Guest session has expired');
        request.user = { uid: guestSession.guestSessionId, role: UserRole.GUEST_USER, guestSessionId: guestSession.guestSessionId, capabilities: this.stringArray(guestSession.capabilitiesJson) };
        return true;
      }

      const user = await this.repository.findUserForJwtGuard(payload.uid);

      if (!user || user.deletedAt || !user.isActive) {
        throw new ForbiddenException('Account is inactive');
      }

      if (payload.sessionId) {
        const session = await this.repository.findActiveSessionForJwtGuard(payload.sessionId, user.id);
        if (!session) throw new UnauthorizedException('Session has expired');
      }

      if (user.role === UserRole.ADMIN) {
        if (!user.adminRoleId || !user.adminRole || user.adminRole.deletedAt || !user.adminRole.isActive) {
          throw new ForbiddenException('Admin role is inactive or missing');
        }
      }

      if (user.role === UserRole.PROVIDER && this.isBlockedProviderModule(request.path) && (user.providerApprovalStatus !== ProviderApprovalStatus.APPROVED || !user.isActive || user.suspendedAt)) {
        throw new ForbiddenException('Your provider account is pending approval. You cannot access this module yet.');
      }


      request.user = {
        uid: user.id,
        role: user.role,
        permissions: user.role === UserRole.ADMIN ? user.adminRole?.permissions ?? undefined : undefined,
        sessionId: payload.sessionId,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private isBlockedProviderModule(path: string): boolean {
    if (path.startsWith('/api/v1/chats')) return true;
    if (!path.startsWith('/api/v1/provider/')) return false;
    if (path.startsWith('/api/v1/provider/business-info')) return false;
    return true;
  }

  private stringArray(value: Prisma.JsonValue): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim();
  }
}
