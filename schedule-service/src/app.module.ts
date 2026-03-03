import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { CustomerModule } from './customer/customer.module';
import { DoctorModule } from './doctor/doctor.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    // ── Global Config ──────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── GraphQL ────────────────────────────────────────────────────────────
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }) => ({ req }),
    }),

    // ── Redis Cache ────────────────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const { createClient } = await import('redis');
        const { redisInsStore } = await import('cache-manager-redis-yet');

        const redisClient = createClient({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        });

        await redisClient.connect();

        return {
          store: redisInsStore(redisClient as any, { ttl: 60 * 1000 /* 60 sec */ }),
        };
      },
      inject: [ConfigService],
    }),

    // ── Feature Modules ────────────────────────────────────────────────────
    PrismaModule,
    CommonModule,
    CustomerModule,
    DoctorModule,
    ScheduleModule,
  ],
})
export class AppModule {}
