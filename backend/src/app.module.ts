import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HabitsModule } from './habits/habits.module';
import { TrackingModule } from './tracking/tracking.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { InsightsModule } from './insights/insights.module';
import { DigestModule } from './digest/digest.module';
import { AuditModule } from './audit/audit.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function buildDbConfig(): TypeOrmModuleOptions {
  const driver = (process.env.DB_DRIVER ?? 'sqlite').toLowerCase();
  const common = {
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNC !== 'false',
  } as const;

  if (driver === 'postgres') {
    return {
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'reveil',
      ...common,
    };
  }

  return {
    type: 'sqlite',
    database: process.env.DB_PATH ?? 'reveil.sqlite',
    ...common,
  };
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      // Default: 100 requests per minute per IP.
      { name: 'default', ttl: 60_000, limit: 100 },
      // Tight cap on AI feedback to protect OpenAI quota / cost.
      { name: 'ai', ttl: 60_000, limit: 5 },
    ]),
    TypeOrmModule.forRoot(buildDbConfig()),
    AuthModule,
    UsersModule,
    HabitsModule,
    TrackingModule,
    FeedbackModule,
    DashboardModule,
    NotificationsModule,
    HealthModule,
    InsightsModule,
    DigestModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }
