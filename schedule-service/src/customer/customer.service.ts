import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { CustomerModel } from './models/customer.model';
import { CustomerPaginatedResult } from './models/customer-paginated.model';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCustomerInput): Promise<CustomerModel> {
    const existing = await this.prisma.customer.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException(`Customer with email ${input.email} already exists`);
    }

    return this.prisma.customer.create({ data: input });
  }

  async update(input: UpdateCustomerInput): Promise<CustomerModel> {
    await this.findOneOrFail(input.id);

    if (input.email) {
      const emailConflict = await this.prisma.customer.findFirst({
        where: { email: input.email, NOT: { id: input.id } },
      });
      if (emailConflict) {
        throw new ConflictException(`Email ${input.email} is already in use`);
      }
    }

    return this.prisma.customer.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
      },
    });
  }

  async findAll(page: number, limit: number): Promise<CustomerPaginatedResult> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<CustomerModel> {
    return this.findOneOrFail(id);
  }

  async delete(id: string): Promise<CustomerModel> {
    await this.findOneOrFail(id);
    return this.prisma.customer.delete({ where: { id } });
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private async findOneOrFail(id: string): Promise<CustomerModel> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }
}
