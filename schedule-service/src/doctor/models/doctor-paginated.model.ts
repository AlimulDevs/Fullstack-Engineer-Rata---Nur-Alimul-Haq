import { ObjectType, Field, Int } from '@nestjs/graphql';
import { DoctorModel } from './doctor.model';

@ObjectType({ description: 'Paginated list of doctors' })
export class DoctorPaginatedResult {
  @Field(() => [DoctorModel], { description: 'List of doctors for the current page' })
  data: DoctorModel[];

  @Field(() => Int, { description: 'Total number of doctors' })
  total: number;

  @Field(() => Int, { description: 'Current page number' })
  page: number;

  @Field(() => Int, { description: 'Number of items per page' })
  limit: number;
}
