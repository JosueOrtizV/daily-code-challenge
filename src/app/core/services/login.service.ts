import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class LoginService {
    constructor(private authService: AuthService) {}

    async loginAnonymously(username: string): Promise<void> {
        let normalizedUsername = this.authService.normalizeUsername(username.trim());

        if (normalizedUsername) {
            const regex = /^[a-zA-Z0-9_.-]{4,16}$/;
            if (regex.test(normalizedUsername)) {
                try {
                    const anonymousUid = this.authService.getAnonymousUid();

                    if (anonymousUid) {
                        await this.authService.checkUsernameAndUid(normalizedUsername, anonymousUid);
                        await this.authService.loginAnonymously(normalizedUsername);
                    } else {
                        const isAvailable = await this.authService.checkUsernameAvailability(normalizedUsername);
                        
                        if (isAvailable) {
                            await this.authService.loginAnonymously(normalizedUsername);
                        } else {
                            throw new Error('login.error_username_taken');
                        }
                    }
                } catch (error: unknown) {
                    if (error instanceof Error && error.message === 'login.error_username_taken') {
                        throw new Error('login.error_username_taken');
                    }
                    else if (error instanceof Error && error.message === 'login.error_invalid_username_for_uid') {
                        throw new Error('login.error_invalid_username_for_uid');
                    } else {
                        throw new Error('login.error_anonymous_login');
                    }
                }
            } else {
                throw new Error('login.error_invalid_username');
            }
        } else {
            throw new Error('login.error_username_required');
        }
    }
}
