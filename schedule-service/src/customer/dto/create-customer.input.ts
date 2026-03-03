import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input for creating a new customer' })
export class CreateCustomerInput {
  @Field({ description: 'Customer full name' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @Field({ description: 'Customer email address (must be unique)' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
