import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { ShareCardService } from './share-card.service';
import { FeedbackLog } from './feedback.entity';
import { Habit } from '../habits/habit.entity';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FeedbackLog, Habit]),
        HttpModule,
        AuthModule,
        TrackingModule,
    ],
    controllers: [FeedbackController],
    providers: [FeedbackService, ShareCardService],
    exports: [FeedbackService],
})
export class FeedbackModule { }
