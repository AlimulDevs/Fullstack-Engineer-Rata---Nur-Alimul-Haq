import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, Min, Max } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10, description: 'Items per page (max 100)' })
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
