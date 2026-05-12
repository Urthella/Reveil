import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ExpoMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: 'default' | null;
    categoryId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class ExpoPushClient {
    private readonly logger = new Logger(ExpoPushClient.name);
    constructor(private readonly http: HttpService) { }

    /** Sends a batch to Expo's push service. Tokens that don't match the
     * Expo push token format are silently skipped.
     *
     * Pass `categoryId` to attach interactive action buttons (e.g. snooze).
     * Categories must be registered client-side first. */
    async send(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, unknown>,
        categoryId?: string,
    ): Promise<{ sent: number }> {
        const validTokens = tokens.filter((t) => /^Expo(nent)?PushToken\[/i.test(t));
        if (validTokens.length === 0) {
            this.logger.debug('No valid Expo push tokens — skipping send');
            return { sent: 0 };
        }
        const messages: ExpoMessage[] = validTokens.map((to) => ({
            to,
            title,
            body,
            sound: 'default',
            data,
            ...(categoryId ? { categoryId } : {}),
        }));

        try {
            await firstValueFrom(
                this.http.post(EXPO_PUSH_URL, messages, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 8000,
                }),
            );
            return { sent: messages.length };
        } catch (err: any) {
            this.logger.warn(`Expo push send failed: ${err.message}`);
            return { sent: 0 };
        }
    }
}
