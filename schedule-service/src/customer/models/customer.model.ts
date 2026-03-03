import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Customer entity' })
export class CustomerModel {
  @Field(() => ID, { description: 'Unique customer identifier (UUID)' })
  id: string;

  @Field({ description: 'Customer full name' })
  name: string;

  @Field({ description: 'Customer email address' })
  email: string;

  @Field({ description: 'Record creation timestamp' })
  createdAt: Date;

  @Field({ description: 'Record last update timestamp' })
  updatedAt: Date;
}
