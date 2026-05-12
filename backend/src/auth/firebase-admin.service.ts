import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface VerifiedUser {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    picture?: string;
}

/**
 * Verifies Firebase ID tokens. Falls back to a deterministic mock identity
 * when Firebase credentials are not configured — this keeps dev ergonomic
 * without forcing a service account on every machine.
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseAdminService.name);
    private app?: admin.app.App;
    private mockMode = false;

    onModuleInit() {
        if (admin.apps.length > 0) {
            this.app = admin.app();
            return;
        }

        const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        try {
            if (credentialsJson) {
                const parsed = JSON.parse(credentialsJson);
                this.app = admin.initializeApp({
                    credential: admin.credential.cert(parsed),
                    projectId: parsed.project_id,
                });
                this.logger.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT');
                return;
            }
            if (credentialsPath) {
                this.app = admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId,
                });
                this.logger.log('Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS');
                return;
            }
        } catch (err: any) {
            this.logger.error(`Firebase Admin init failed: ${err.message}`);
        }

        this.mockMode = true;
        this.logger.warn(
            'Firebase Admin not configured — running in MOCK auth mode. ' +
            'Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS to enable real verification.',
        );
    }

    isMock(): boolean {
        return this.mockMode;
    }

    async verifyToken(token: string, fallbackHeaderUid?: string): Promise<VerifiedUser> {
        if (this.mockMode) {
            const uid =
                fallbackHeaderUid ||
                (token && token !== 'mock-token' ? token : 'test-user-123');
            return {
                uid,
                email: `${uid}@reveil.app`,
                emailVerified: true,
            };
        }
        const decoded = await admin.auth(this.app!).verifyIdToken(token);
        return {
            uid: decoded.uid,
            email: decoded.email ?? `${decoded.uid}@unknown`,
            emailVerified: decoded.email_verified ?? false,
            displayName: decoded.name,
            picture: decoded.picture,
        };
    }
}
