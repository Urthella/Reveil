import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateHabitDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsIn(['daily', 'weekly'])
    frequency?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    targetCount?: number;

    @IsOptional()
    @IsIn(['morning', 'afternoon', 'evening', 'anytime'])
    timeOfDay?: string;

    @IsOptional()
    @IsIn(['health', 'productivity', 'mindfulness', 'social', 'recovery', 'general'])
    category?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(7)
    weeklyTarget?: number;

    @IsOptional()
    @IsDateString()
    pausedUntil?: string | null;
}
