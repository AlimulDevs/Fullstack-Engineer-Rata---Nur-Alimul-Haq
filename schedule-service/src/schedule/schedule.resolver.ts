import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleModel } from './models/schedule.model';
import { SchedulePaginatedResult } from './models/schedule-paginated.model';
import { CreateScheduleInput } from './dto/create-schedule.input';
import { FilterScheduleArgs } from './dto/filter-schedule.args';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Resolver(() => ScheduleModel)
@UseGuards(AuthGuard)
export class ScheduleResolver {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Mutation(() => ScheduleModel, { description: 'Create a new consultation schedule' })
  createSchedule(
    @Args('input') input: CreateScheduleInput,
    @CurrentUser() _user: AuthUser,
  ): Promise<ScheduleModel> {
    return this.scheduleService.create(input);
  }

  @Query(() => SchedulePaginatedResult, {
    description: 'List schedules with optional filters (customerId, doctorId, date range) and pagination',
  })
  schedules(
    @Args() args: FilterScheduleArgs,
    @CurrentUser() _user: AuthUser,
  ): Promise<SchedulePaginatedResult> {
    return this.scheduleService.findAll(args);
  }

  @Query(() => ScheduleModel, { description: 'Get a schedule by ID' })
  schedule(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<ScheduleModel> {
    return this.scheduleService.findOne(id);
  }

  @Mutation(() => ScheduleModel, { description: 'Delete a schedule by ID' })
  deleteSchedule(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<ScheduleModel> {
    return this.scheduleService.delete(id);
  }
}
