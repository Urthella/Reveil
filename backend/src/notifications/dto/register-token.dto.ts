import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterTokenDto {
    @IsString()
    @MaxLength(300)
    token: string;

    @IsOptional()
    @IsIn(['expo', 'fcm', 'apns'])
    platform?: string;
}
