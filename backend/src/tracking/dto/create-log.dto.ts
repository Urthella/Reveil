export class CreateLogDto {
    habitId: string;
    date: string; // YYYY-MM-DD
    completed?: boolean;
    moodScore?: number;
    notes?: string;
}
