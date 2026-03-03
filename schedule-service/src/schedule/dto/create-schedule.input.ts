import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsUUID, IsDateString, MinLength } from 'class-validator';

@InputType({ description: 'Input for creating a new schedule' })
export class CreateScheduleInput {
  @Field({ description: 'Purpose / objective of the consultation' })
  @IsString()
  @MinLength(3, { message: 'Objective must be at least 3 characters' })
  objective: string;

  @Field(() => ID, { description: 'Customer UUID' })
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId: string;

  @Field(() => ID, { description: 'Doctor UUID' })
  @IsUUID('4', { message: 'doctorId must be a valid UUID' })
  doctorId: string;

  @Field({ description: 'ISO-8601 datetime for the scheduled consultation (e.g. 2024-06-15T09:00:00Z)' })
  @IsDateString({}, { message: 'scheduledAt must be a valid ISO-8601 date string' })
  scheduledAt: string;
}
