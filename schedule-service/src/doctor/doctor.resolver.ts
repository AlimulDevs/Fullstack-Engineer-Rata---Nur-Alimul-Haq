import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorModel } from './models/doctor.model';
import { DoctorPaginatedResult } from './models/doctor-paginated.model';
import { CreateDoctorInput } from './dto/create-doctor.input';
import { UpdateDoctorInput } from './dto/update-doctor.input';
import { PaginationArgs } from '../common/dto/pagination.args';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Resolver(() => DoctorModel)
@UseGuards(AuthGuard)
export class DoctorResolver {
  constructor(private readonly doctorService: DoctorService) {}

  @Mutation(() => DoctorModel, { description: 'Create a new doctor' })
  createDoctor(
    @Args('input') input: CreateDoctorInput,
    @CurrentUser() _user: AuthUser,
  ): Promise<DoctorModel> {
    return this.doctorService.create(input);
  }

  @Mutation(() => DoctorModel, { description: 'Update an existing doctor' })
  updateDoctor(
    @Args('input') input: UpdateDoctorInput,
    @CurrentUser() _user: AuthUser,
  ): Promise<DoctorModel> {
    return this.doctorService.update(input);
  }

  @Query(() => DoctorPaginatedResult, {
    description: 'List all doctors with pagination',
  })
  doctors(
    @Args() pagination: PaginationArgs,
    @CurrentUser() _user: AuthUser,
  ): Promise<DoctorPaginatedResult> {
    return this.doctorService.findAll(
      pagination.page ?? 1,
      pagination.limit ?? 10,
    );
  }

  @Query(() => DoctorModel, { description: 'Get a doctor by ID' })
  doctor(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<DoctorModel> {
    return this.doctorService.findOne(id);
  }

  @Mutation(() => DoctorModel, { description: 'Delete a doctor by ID' })
  deleteDoctor(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<DoctorModel> {
    return this.doctorService.delete(id);
  }
}
