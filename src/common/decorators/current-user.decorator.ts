import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface AuthUserContext {
  uid: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserContext => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserContext }>();
    return request.user;
  },
);
