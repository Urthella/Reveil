import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { FirebaseAdminService } from './firebase-admin.service';

@Module({
    providers: [FirebaseAdminService, AuthGuard],
    exports: [FirebaseAdminService, AuthGuard],
})
export class AuthModule { }
