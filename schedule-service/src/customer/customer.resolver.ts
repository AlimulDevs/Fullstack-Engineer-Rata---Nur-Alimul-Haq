import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerModel } from './models/customer.model';
import { CustomerPaginatedResult } from './models/customer-paginated.model';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { PaginationArgs } from '../common/dto/pagination.args';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Resolver(() => CustomerModel)
@UseGuards(AuthGuard)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @Mutation(() => CustomerModel, { description: 'Create a new customer' })
  createCustomer(
    @Args('input') input: CreateCustomerInput,
    @CurrentUser() _user: AuthUser,
  ): Promise<CustomerModel> {
    return this.customerService.create(input);
  }

  @Mutation(() => CustomerModel, { description: 'Update an existing customer' })
  updateCustomer(
    @Args('input') input: UpdateCustomerInput,
    @CurrentUser() _user: AuthUser,
  ): Promise<CustomerModel> {
    return this.customerService.update(input);
  }

  @Query(() => CustomerPaginatedResult, {
    description: 'List all customers with pagination',
  })
  customers(
    @Args() pagination: PaginationArgs,
    @CurrentUser() _user: AuthUser,
  ): Promise<CustomerPaginatedResult> {
    return this.customerService.findAll(
      pagination.page ?? 1,
      pagination.limit ?? 10,
    );
  }

  @Query(() => CustomerModel, { description: 'Get a customer by ID' })
  customer(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<CustomerModel> {
    return this.customerService.findOne(id);
  }

  @Mutation(() => CustomerModel, { description: 'Delete a customer by ID' })
  deleteCustomer(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<CustomerModel> {
    return this.customerService.delete(id);
  }
}
