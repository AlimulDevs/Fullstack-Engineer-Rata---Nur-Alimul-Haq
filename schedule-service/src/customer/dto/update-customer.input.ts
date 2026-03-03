import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateCustomerInput } from './create-customer.input';

@InputType({ description: 'Input for updating an existing customer' })
export class UpdateCustomerInput extends PartialType(CreateCustomerInput) {
  @Field(() => ID, { description: 'Customer ID to update' })
  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}
