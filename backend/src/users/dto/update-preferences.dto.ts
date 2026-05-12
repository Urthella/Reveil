import { IsBoolean, IsIn, IsOptional, Matches } from 'class-validator';

export class UpdatePreferencesDto {
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietHoursStart must be HH:mm' })
    quietHoursStart?: string | null;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietHoursEnd must be HH:mm' })
    quietHoursEnd?: string | null;

    @IsOptional()
    @IsIn(['en', 'tr'])
    locale?: 'en' | 'tr';

    @IsOptional()
    @IsBoolean()
    digestEnabled?: boolean;
}
