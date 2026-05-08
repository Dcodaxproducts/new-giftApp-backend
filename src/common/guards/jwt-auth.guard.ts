import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUserContext } from '../decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

interface JwtPayload extends AuthUserContext {
  type?: string;
  permissions?: Prisma.JsonValue;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
      const user = await this.prisma.user.findUnique({
        where: { id: payload.uid },
        include: { adminRole: true },
      });

      if (!user || user.deletedAt || !user.isActive) {
        throw new ForbiddenException('Account is inactive');
      }

      if (user.role === UserRole.ADMIN) {
        if (!user.adminRoleId || !user.adminRole || user.adminRole.deletedAt || !user.adminRole.isActive) {
          throw new ForbiddenException('Admin role is inactive or missing');
        }
      }

      request.user = {
        uid: user.id,
        role: user.role,
        permissions: user.role === UserRole.ADMIN ? user.adminRole?.permissions ?? undefined : undefined,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim();
  }
}
