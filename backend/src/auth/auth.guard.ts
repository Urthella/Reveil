import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly firebase: FirebaseAdminService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);
        const headerUid = (request.headers['x-user-id'] as string | undefined) || undefined;

        if (!token && !this.firebase.isMock()) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const user = await this.firebase.verifyToken(token ?? '', headerUid);
            request['user'] = user;
            return true;
        } catch (err: any) {
            throw new UnauthorizedException(`Invalid token: ${err.message}`);
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
