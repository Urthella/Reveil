import { IsIn } from 'class-validator';

export class RateFeedbackDto {
    @IsIn([-1, 0, 1])
    rating: -1 | 0 | 1;
}
