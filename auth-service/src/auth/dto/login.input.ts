import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input for user login' })
export class LoginInput {
  @Field({ description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field({ description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;
}
