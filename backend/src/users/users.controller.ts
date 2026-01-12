import { Controller, Get, Post, Request, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getProfile(@Request() req) {
        // Return DB record of the authenticated user
        return this.usersService.findOne(req.user.uid);
    }

    @Post('sync')
    async syncUser(@Request() req) {
        // Sync the user from the auth token to the DB
        const userDto = {
            id: req.user.uid,
            email: req.user.email,
            displayName: req.user.name || undefined, // Firebase uses 'name' sometimes, adjust as needed
            photoUrl: req.user.picture || undefined
        };
        return this.usersService.syncUser(userDto);
    }
}
