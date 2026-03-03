import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateDoctorInput } from './create-doctor.input';

@InputType({ description: 'Input for updating an existing doctor' })
export class UpdateDoctorInput extends PartialType(CreateDoctorInput) {
  @Field(() => ID, { description: 'Doctor ID to update' })
  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}
