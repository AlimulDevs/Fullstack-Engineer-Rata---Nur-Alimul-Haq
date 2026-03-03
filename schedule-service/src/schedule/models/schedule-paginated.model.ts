import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ScheduleModel } from './schedule.model';

@ObjectType({ description: 'Paginated list of schedules' })
export class SchedulePaginatedResult {
  @Field(() => [ScheduleModel], { description: 'List of schedules for the current page' })
  data: ScheduleModel[];

  @Field(() => Int, { description: 'Total number of matching schedules' })
  total: number;

  @Field(() => Int, { description: 'Current page number' })
  page: number;

  @Field(() => Int, { description: 'Number of items per page' })
  limit: number;
}
