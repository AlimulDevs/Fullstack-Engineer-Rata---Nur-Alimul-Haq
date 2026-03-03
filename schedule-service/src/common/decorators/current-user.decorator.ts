import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '../interfaces/auth-user.interface';

/**
 * @CurrentUser() decorator – extracts the authenticated user from GraphQL context.
 * Requires AuthGuard to be applied.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ user: AuthUser }>().user;
  },
);
