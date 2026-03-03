import { ObjectType, Field, Int } from '@nestjs/graphql';
import { CustomerModel } from './customer.model';

@ObjectType({ description: 'Paginated list of customers' })
export class CustomerPaginatedResult {
  @Field(() => [CustomerModel], { description: 'List of customers for the current page' })
  data: CustomerModel[];

  @Field(() => Int, { description: 'Total number of customers' })
  total: number;

  @Field(() => Int, { description: 'Current page number' })
  page: number;

  @Field(() => Int, { description: 'Number of items per page' })
  limit: number;
}
