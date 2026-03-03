import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorInput } from './dto/create-doctor.input';
import { UpdateDoctorInput } from './dto/update-doctor.input';
import { DoctorModel } from './models/doctor.model';
import { DoctorPaginatedResult } from './models/doctor-paginated.model';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDoctorInput): Promise<DoctorModel> {
    return this.prisma.doctor.create({ data: input });
  }

  async update(input: UpdateDoctorInput): Promise<DoctorModel> {
    await this.findOneOrFail(input.id);

    return this.prisma.doctor.update({
      where: { id: input.id },
      data: { ...(input.name && { name: input.name }) },
    });
  }

  async findAll(page: number, limit: number): Promise<DoctorPaginatedResult> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<DoctorModel> {
    return this.findOneOrFail(id);
  }

  async delete(id: string): Promise<DoctorModel> {
    await this.findOneOrFail(id);
    return this.prisma.doctor.delete({ where: { id } });
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private async findOneOrFail(id: string): Promise<DoctorModel> {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }
}
