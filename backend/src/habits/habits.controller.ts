import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('habits')
@UseGuards(AuthGuard)
export class HabitsController {
    constructor(private readonly habitsService: HabitsService) { }

    @Post()
    create(@Body() createHabitDto: CreateHabitDto, @Request() req) {
        return this.habitsService.create(createHabitDto, req.user.uid);
    }

    @Get()
    findAll(@Request() req) {
        return this.habitsService.findAll(req.user.uid);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.habitsService.findOne(id, req.user.uid);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.habitsService.remove(id, req.user.uid);
    }
}
