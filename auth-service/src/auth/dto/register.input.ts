import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input for user registration' })
export class RegisterInput {
  @Field({ description: 'User email address (must be unique)' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field({ description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
