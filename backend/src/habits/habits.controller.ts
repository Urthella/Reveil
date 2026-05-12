import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { ReorderHabitsDto } from './dto/reorder-habits.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('habits')
@ApiBearerAuth()
@Controller('habits')
@UseGuards(AuthGuard)
export class HabitsController {
    constructor(private readonly habitsService: HabitsService) { }

    @Post()
    create(@Body() createHabitDto: CreateHabitDto, @Request() req) {
        return this.habitsService.create(createHabitDto, req.user.uid);
    }

    @Get()
    findAll(
        @Request() req,
        @Query('category') category?: string,
        @Query('includePaused') includePaused?: string,
        @Query('q') q?: string,
    ) {
        return this.habitsService.findAll(req.user.uid, category, includePaused === 'true', q);
    }

    @Post('reorder')
    reorder(@Body() dto: ReorderHabitsDto, @Request() req) {
        return this.habitsService.reorder(req.user.uid, dto.items);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.habitsService.findOne(id, req.user.uid);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateHabitDto, @Request() req) {
        return this.habitsService.update(id, req.user.uid, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.habitsService.remove(id, req.user.uid);
    }
}
