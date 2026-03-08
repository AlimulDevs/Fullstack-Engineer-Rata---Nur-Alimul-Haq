import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput } from './dto/create-schedule.input';
import { FilterScheduleArgs } from './dto/filter-schedule.args';
import { ScheduleModel } from './models/schedule.model';
import { SchedulePaginatedResult } from './models/schedule-paginated.model';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(input: CreateScheduleInput): Promise<ScheduleModel> {
    // 1. Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${input.customerId} not found`);
    }

    // 2. Validate doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: input.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${input.doctorId} not found`);
    }

    const scheduledAt = new Date(input.scheduledAt);

    // 3. Check for scheduling conflicts – same doctor, same time
    const conflict = await this.prisma.schedule.findFirst({
      where: {
        doctorId: input.doctorId,
        scheduledAt,
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Doctor ${doctor.name} already has an appointment at ${scheduledAt.toISOString()}`,
      );
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        objective: input.objective,
        customerId: input.customerId,
        doctorId: input.doctorId,
        scheduledAt,
      },
      include: { customer: true, doctor: true },
    });

    // 4. Queue email notification (fire-and-forget)
    this.notificationService
      .sendScheduleCreatedNotification({
        customerEmail: customer.email,
        customerName: customer.name,
        doctorName: doctor.name,
        objective: schedule.objective,
        scheduledAt: schedule.scheduledAt,
      })
      .catch(() => {
        // Notification errors are non-blocking
        console.error('Failed to send schedule creation notification');
      });

    return schedule;
  }

  async findAll(args: FilterScheduleArgs): Promise<SchedulePaginatedResult> {
    const { page = 1, limit = 10, customerId, doctorId, fromDate, toDate } = args;
    const skip = (page - 1) * limit;

    const where = {
      ...(customerId && { customerId }),
      ...(doctorId && { doctorId }),
      ...(fromDate || toDate
        ? {
            scheduledAt: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: { customer: true, doctor: true },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ScheduleModel> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: { customer: true, doctor: true },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async delete(id: string): Promise<ScheduleModel> {
    const schedule = await this.findOne(id);

    await this.prisma.schedule.delete({ where: { id } });

    // Queue email notification (fire-and-forget)
    if (schedule.customer) {
      this.notificationService
        .sendScheduleDeletedNotification({
          customerEmail: schedule.customer.email,
          customerName: schedule.customer.name,
          doctorName: schedule.doctor?.name ?? 'Unknown',
          objective: schedule.objective,
          scheduledAt: schedule.scheduledAt,
        })
        .catch(() => {
          // Notification errors are non-blocking
          console.error('Failed to send schedule deletion notification');
        });
    }

    return schedule;
  }
}
