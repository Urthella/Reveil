import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateReminderDto {
    @IsOptional()
    @IsUUID()
    habitId?: string;

    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:mm 24h' })
    time: string;

    @IsOptional()
    @Matches(/^[1-7](,[1-7])*$/, { message: 'weekdays must be comma-separated 1..7 (Mon=1)' })
    weekdays?: string;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(140)
    message?: string;
}
