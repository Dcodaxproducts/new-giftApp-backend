import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

export interface AuthUserContext {
  uid: string;
  role: UserRole;
  permissions?: Prisma.JsonValue;
  sessionId?: string;
  guestSessionId?: string;
  capabilities?: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserContext => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserContext }>();
    return request.user;
  },
);
