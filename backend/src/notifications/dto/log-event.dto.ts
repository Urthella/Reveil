import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class LogNotificationEventDto {
    @IsIn(['tap', 'dismiss', 'shown'])
    eventType: 'tap' | 'dismiss' | 'shown';

    @IsOptional()
    @IsUUID()
    reminderId?: string;

    @IsOptional()
    @IsUUID()
    habitId?: string;
}
