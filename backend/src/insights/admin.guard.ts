import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Coarse admin guard for the insights endpoint. Looks for either:
 *   - X-Admin-Token header matching `process.env.ADMIN_TOKEN`, or
 *   - the authenticated user.uid matching `process.env.ADMIN_UID`.
 *
 * In production, replace with role-based auth.
 */
@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const tokenHeader = req.headers['x-admin-token'];
        const expected = process.env.ADMIN_TOKEN;
        const adminUid = process.env.ADMIN_UID;

        if (expected && tokenHeader === expected) return true;
        if (adminUid && req.user?.uid === adminUid) return true;
        throw new ForbiddenException('Admin only');
    }
}
