import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class GenerateFeedbackDto {
    @IsOptional()
    @IsUUID()
    habitId?: string;

    @IsOptional()
    @IsIn(['en', 'tr'])
    locale?: 'en' | 'tr';

    @IsOptional()
    @IsIn(['gentle', 'firm', 'playful', 'coach'])
    tone?: 'gentle' | 'firm' | 'playful' | 'coach';
}
