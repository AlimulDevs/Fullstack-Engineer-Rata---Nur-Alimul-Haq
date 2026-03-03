import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Doctor entity' })
export class DoctorModel {
  @Field(() => ID, { description: 'Unique doctor identifier (UUID)' })
  id: string;

  @Field({ description: 'Doctor full name' })
  name: string;

  @Field({ description: 'Record creation timestamp' })
  createdAt: Date;

  @Field({ description: 'Record last update timestamp' })
  updatedAt: Date;
}
