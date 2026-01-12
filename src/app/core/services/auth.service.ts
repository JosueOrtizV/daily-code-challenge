import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, getIdToken, signInAnonymously, signOut, linkWithPopup, onAuthStateChanged, User, signInWithCustomToken } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { CsrfService } from './csrf.service';
import Cookies from 'js-cookie';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private ANONYMOUS_UID = 'anonymousUid';

    constructor(
        private auth: Auth,
        private http: HttpClient,
        private csrfService: CsrfService,
        private userService: UserService
    ) {}

    normalizeUsername(username: string): string {
        return username.normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    }

    getAnonymousUid(): string | null {
        return localStorage.getItem(this.ANONYMOUS_UID) || null;
    }

    private setAnonymousUid(uid: string): void {
        localStorage.setItem(this.ANONYMOUS_UID, uid);
    }
    

    private clearAnonymousUid(): void {
        localStorage.removeItem(this.ANONYMOUS_UID);
    }

    async loginWithGoogle(): Promise<void> {
        try {
            const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
            const token = await getIdToken(result.user);
            const decodedToken = await this.auth.currentUser?.getIdTokenResult();
            const username = this.normalizeUsername(result.user.displayName || '');

            await this.saveOrUpdateUser(username, token);
            await this.userService.loadUserData();
        } catch (error) {
            console.error('Error logging in with Google:', error);
            await this.handleLoginError();
            throw new Error('Google login failed');
        }
    }

    async loginWithGithub(): Promise<void> {
        try {
            const result = await signInWithPopup(this.auth, new GithubAuthProvider());
            const token = await getIdToken(result.user);
            const decodedToken = await this.auth.currentUser?.getIdTokenResult();
            const username = this.normalizeUsername(result.user.displayName || '');
            
            await this.saveOrUpdateUser(username, token);
            await this.userService.loadUserData();
        } catch (error) {
            console.error('Error logging in with Github:', error);
            await this.handleLoginError();
            throw new Error('Github login failed');
        }
    }
    

    async loginAnonymously(username: string): Promise<void> {
        let result;
        try {
            let anonymousUid = this.getAnonymousUid();
    
            if (anonymousUid) {
                const customToken = await this.getCustomToken(anonymousUid, username);
                result = await signInWithCustomToken(this.auth, customToken);
            } else {
                result = await signInAnonymously(this.auth);
    
                anonymousUid = result.user.uid;
            }
    
            const token = await getIdToken(result.user);
    
            await this.saveOrUpdateUser(username, token);
            await this.userService.loadUserData();
    

            if (!this.getAnonymousUid() && anonymousUid) {
                this.setAnonymousUid(anonymousUid);
            }
        } catch (error) {
            console.error('Error logging in anonymously:', error);
            await this.handleLoginError();
            throw new Error('Anonymous login failed');
        }
    }    

    async getCustomToken(uid: string, username: string): Promise<string> {
        try {
            await this.csrfService.getCsrfToken().toPromise();
            const response = await this.http.post<{ customToken: string }>(
                `${environment.apiUrl}/user/generateCustomToken`, 
                { uid, username }, { withCredentials: true }
            ).toPromise();
            if (response) {
                return response?.customToken;
            } else {
                throw new Error('Error checking username availability');
            }
        } catch (error) {
            console.error('Error getting custom token:', error);
            throw new Error('Failed to get custom token');
        }
    }

    async checkUsernameAndUid(username: string, uid: string): Promise<boolean> {
        try {
            const response = await this.http.get<{ valid: boolean }>(
                `${environment.apiUrl}/user/checkUsernameAndUid`, 
                {
                    params: { username, uid }
                }
            ).toPromise();
    
            if (response) {
                return response.valid;
            } else {
                throw new Error('Error checking username and UID');
            }
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                throw new Error('login.error_invalid_username_for_uid');
            }
            console.error('Error checking username and UID:', error);
            throw new Error('Error checking username and UID');
        }
    }
    

    

    async saveOrUpdateUser(username: string, token: string): Promise<void> {
        try {
                await this.csrfService.getCsrfToken().toPromise();
                const headers = new HttpHeaders()
                    .set('Authorization', `Bearer ${token}`)
                
                await this.http.post(
                    `${environment.apiUrl}/user/saveOrUpdateUser`,
                    { username, token },
                    { headers, withCredentials: true }
                ).toPromise();
            
        } catch (error) {
            await this.handleLoginError();
            console.error('Error saving or updating user:', error);
            throw new Error('Save or update user failed');
        }
    }
    
    

    async checkUsernameAvailability(username: string): Promise<boolean> {
        try {
            const response = await this.http.get<{ available: boolean }>(
                `${environment.apiUrl}/user/checkUsernameAvailability`, 
                {
                    params: { username }
                }
            ).toPromise();
    
            if (response) {
                return response.available;
            } else {
                throw new Error('Error checking username availability');
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            throw new Error('Error checking username availability');
        }
    }
    

    async getUserToken(): Promise<string | null> {
        try {
            const user = this.auth.currentUser;
            return user ? await getIdToken(user, true) : null;
        } catch (error) {
            console.error('Error getting user token:', error);
            return null;
        }
    }

    getCurrentUser(): User | null {
        return this.auth.currentUser;
    }

    onAuthStateChanged(callback: (user: User | null) => void): void { 
        onAuthStateChanged(this.auth, callback); 
    }

    async logout(): Promise<void> {
        try {
            await signOut(this.auth);
            console.log('Logged Out');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    private async handleLoginError(): Promise<void> {
        await this.logout();
        console.error('Error during login process, logging out for safety.');
    }

    async linkGoogleAccount(): Promise<void> {
        const currentUser = this.auth.currentUser;
        if (currentUser) {
            try {
                await linkWithPopup(currentUser, new GoogleAuthProvider());            
            } catch (error) {
                console.error('Error linking Google account:', error);
                throw new Error('Linking Google account failed');
            }
        }
    }

    async linkGitHubAccount(): Promise<void> {
        const currentUser = this.auth.currentUser;
        if (currentUser) {
            try {
                await linkWithPopup(currentUser, new GithubAuthProvider());
            } catch (error) {
                console.error('Error linking GitHub account:', error);
                throw new Error('Linking GitHub account failed');
            }
        }
    }

    async isGoogleLinked(): Promise<boolean> {
        const user = this.auth.currentUser;
        return user ? user.providerData.some(info => info.providerId === 'google.com') : false;
    }

    async isGitHubLinked(): Promise<boolean> {
        const user = this.auth.currentUser;
        return user ? user.providerData.some(info => info.providerId === 'github.com') : false;
    }

    async getLinkedEmail(provider: string): Promise<string | null> {
        const user = this.auth.currentUser;
        if (user) {
            const userInfos = user.providerData.filter(info => info.providerId === provider);
            return userInfos.length > 0 ? userInfos[0].email : null;
        }
        return null;
    }
}
