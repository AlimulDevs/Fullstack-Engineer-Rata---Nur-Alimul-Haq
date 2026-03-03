import { ObjectType, Field } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType({ description: 'Authentication response containing JWT token and user info' })
export class AuthResponse {
  @Field({ description: 'JWT access token' })
  accessToken: string;

  @Field(() => UserModel, { description: 'Authenticated user details' })
  user: UserModel;
}

@ObjectType({ description: 'Token validation response' })
export class ValidateTokenResponse {
  @Field({ description: 'Whether the token is valid' })
  isValid: boolean;

  @Field(() => UserModel, { nullable: true, description: 'User info if token is valid' })
  user?: UserModel;
}
