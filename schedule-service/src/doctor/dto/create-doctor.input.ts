import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input for creating a new doctor' })
export class CreateDoctorInput {
  @Field({ description: 'Doctor full name' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;
}
