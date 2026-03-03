import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthClientService } from '../services/auth-client.service';

/**
 * AuthGuard – validates JWT tokens against Auth Service.
 * Attaches the authenticated user to the GraphQL context.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authClient: AuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext<{ req: { headers: Record<string, string> } }>();

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.substring(7); // strip "Bearer "

    const result = await this.authClient.validateToken(token);

    if (!result.isValid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user to the GQL context for downstream use
    ctx.getContext<{ user: unknown }>().user = result.user;

    return true;
  }
}
