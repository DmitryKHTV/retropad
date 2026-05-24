import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): SafeUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);