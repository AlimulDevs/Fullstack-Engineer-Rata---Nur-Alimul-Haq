import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { PaginationArgs } from '../../common/dto/pagination.args';

@ArgsType()
export class FilterScheduleArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true, description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by doctor ID' })
  @IsOptional()
  @IsUUID('4')
  doctorId?: string;

  @Field({ nullable: true, description: 'Filter schedules from this date (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @Field({ nullable: true, description: 'Filter schedules until this date (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
