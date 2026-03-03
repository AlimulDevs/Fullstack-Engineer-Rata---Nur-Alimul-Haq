import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CustomerModel } from '../../customer/models/customer.model';
import { DoctorModel } from '../../doctor/models/doctor.model';

@ObjectType({ description: 'Schedule (consultation appointment) entity' })
export class ScheduleModel {
  @Field(() => ID, { description: 'Unique schedule identifier (UUID)' })
  id: string;

  @Field({ description: 'Purpose / objective of the consultation' })
  objective: string;

  @Field(() => ID, { description: 'Customer ID' })
  customerId: string;

  @Field(() => ID, { description: 'Doctor ID' })
  doctorId: string;

  @Field({ description: 'Scheduled consultation date and time' })
  scheduledAt: Date;

  @Field({ description: 'Record creation timestamp' })
  createdAt: Date;

  @Field({ description: 'Record last update timestamp' })
  updatedAt: Date;

  @Field(() => CustomerModel, { nullable: true, description: 'Customer details' })
  customer?: CustomerModel;

  @Field(() => DoctorModel, { nullable: true, description: 'Doctor details' })
  doctor?: DoctorModel;
}
