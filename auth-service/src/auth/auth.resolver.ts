import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse, ValidateTokenResponse } from './models/auth-response.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user with email and password.
   * Returns a JWT access token and user details.
   */
  @Mutation(() => AuthResponse, {
    description: 'Register a new user with email and password',
  })
  register(
    @Args('input') input: RegisterInput,
  ): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  /**
   * Login with email and password.
   * Returns a JWT access token and user details.
   */
  @Mutation(() => AuthResponse, {
    description: 'Login with email and password, returns JWT access token',
  })
  login(
    @Args('input') input: LoginInput,
  ): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  /**
   * Validate a JWT token.
   * Called by other services (e.g. Schedule Service) to verify tokens.
   */
  @Query(() => ValidateTokenResponse, {
    description: 'Validate a JWT token (used by other microservices)',
  })
  validateToken(
    @Args('token', { type: () => String }) token: string,
  ): Promise<ValidateTokenResponse> {
    return this.authService.validateToken(token);
  }
}
