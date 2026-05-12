import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

export class CreateHabitDto {
    @IsString()
    @MaxLength(120)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsIn(['daily', 'weekly'])
    frequency: string;

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
    @IsInt()
    @Min(1)
    @Max(7)
    weeklyTarget?: number;
}
