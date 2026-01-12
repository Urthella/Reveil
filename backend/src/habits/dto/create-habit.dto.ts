export class CreateHabitDto {
    title: string;
    description?: string;
    frequency: string;
    targetCount?: number;
    timeOfDay?: string;
}
