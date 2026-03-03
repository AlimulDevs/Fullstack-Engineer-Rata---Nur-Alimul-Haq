import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ValidateTokenGqlResponse {
  data?: {
    validateToken: {
      isValid: boolean;
      user?: {
        id: string;
        email: string;
        createdAt: string;
        updatedAt: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private readonly authServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001/graphql',
    );
  }

  async validateToken(
    token: string,
  ): Promise<{ isValid: boolean; user?: { id: string; email: string; createdAt: Date; updatedAt: Date } }> {
    const query = `
      query ValidateToken($token: String!) {
        validateToken(token: $token) {
          isValid
          user {
            id
            email
            createdAt
            updatedAt
          }
        }
      }
    `;

    try {
      const response = await fetch(this.authServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { token } }),
      });

      if (!response.ok) {
        this.logger.warn(`Auth service returned HTTP ${response.status}`);
        return { isValid: false };
      }

      const body = (await response.json()) as ValidateTokenGqlResponse;

      if (body.errors && body.errors.length > 0) {
        this.logger.warn(`Auth service GraphQL errors: ${body.errors[0].message}`);
        return { isValid: false };
      }

      const result = body.data?.validateToken;

      if (!result) {
        return { isValid: false };
      }

      return {
        isValid: result.isValid,
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
              createdAt: new Date(result.user.createdAt),
              updatedAt: new Date(result.user.updatedAt),
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to reach Auth Service: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Auth service is unavailable');
    }
  }
}
