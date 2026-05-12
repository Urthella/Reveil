import { Body, Controller, Delete, Get, Header, Patch, Post, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { UserExportService } from './export.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly exportService: UserExportService,
    ) { }

    @Get('me')
    async getProfile(@Request() req) {
        return this.usersService.findOne(req.user.uid);
    }

    @Post('sync')
    async syncUser(@Request() req) {
        return this.usersService.syncUser({
            id: req.user.uid,
            email: req.user.email,
            displayName: req.user.displayName,
            photoUrl: req.user.picture,
        });
    }

    @Get('me/export')
    @Header('Content-Type', 'application/json')
    @Header('Content-Disposition', 'attachment; filename="reveil-export.json"')
    async exportMyData(@Request() req, @Res() res: Response) {
        const data = await this.exportService.exportFor(req.user.uid);
        res.send(JSON.stringify(data, null, 2));
    }

    @Get('me/export.csv')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="reveil-logs.csv"')
    async exportMyDataCsv(@Request() req, @Res() res: Response) {
        const csv = await this.exportService.exportCsv(req.user.uid);
        res.send(csv);
    }

    @Post('me/import')
    async importMyData(@Request() req, @Body() body: any) {
        return this.exportService.importFor(req.user.uid, body);
    }

    @Post('me/import.csv')
    async importMyDataCsv(@Request() req) {
        // body-parser plain-text middleware isn't enabled by default; read the raw stream.
        const csv = await new Promise<string>((resolve, reject) => {
            let buf = '';
            req.setEncoding('utf8');
            req.on('data', (chunk: string) => { buf += chunk; });
            req.on('end', () => resolve(buf));
            req.on('error', reject);
        });
        return this.exportService.importCsv(req.user.uid, csv);
    }

    @Delete('me')
    async deleteMyAccount(@Request() req) {
        return this.exportService.deleteAllFor(req.user.uid);
    }

    @Patch('me/preferences')
    async updatePreferences(@Body() dto: UpdatePreferencesDto, @Request() req) {
        return this.usersService.updatePreferences(req.user.uid, dto);
    }
}
