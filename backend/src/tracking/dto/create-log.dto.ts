import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateLogDto {
    @IsUUID()
    habitId: string;

    @IsDateString()
    date: string;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @IsOptional()
    @IsBoolean()
    frozen?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    moodScore?: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
