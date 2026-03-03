import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Authenticated user information' })
export class UserModel {
  @Field(() => ID, { description: 'Unique user identifier (UUID)' })
  id: string;

  @Field({ description: 'User email address' })
  email: string;

  @Field({ description: 'Account creation timestamp' })
  createdAt: Date;

  @Field({ description: 'Last update timestamp' })
  updatedAt: Date;
}
