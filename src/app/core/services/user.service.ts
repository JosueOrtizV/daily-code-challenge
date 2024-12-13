import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { tap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import moment from 'moment-timezone';
import { TranslateService } from '@ngx-translate/core';


interface Activity {
    date: string;
    challengeEN: string;
    challengeES: string;
    statusEN: string;
    statusES: string;
    points: number;
    feedback?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usernameSubject = new BehaviorSubject<string | null>(null);
    private userPhotoSubject = new BehaviorSubject<string | null>(null);
    private loggedInSubject = new BehaviorSubject<boolean>(false);
    private loadingSubject = new BehaviorSubject<boolean>(true);
    private scoresSubject = new BehaviorSubject<{ dailyScore: number, weeklyScore: number, monthlyScore: number, globalScore: number } | null>(null);
    private activitySubject = new BehaviorSubject<Activity[]>([]);
    private lastCompletedExerciseSubject = new BehaviorSubject<string | null>(null);
    private lastChangeDateKey = 'lastChangeDate';
    
    public username$: Observable<string | null> = this.usernameSubject.asObservable();
    public userPhoto$: Observable<string | null> = this.userPhotoSubject.asObservable();
    public loggedIn$: Observable<boolean> = this.loggedInSubject.asObservable();
    public loading$: Observable<boolean> = this.loadingSubject.asObservable();
    public scores$: Observable<{ dailyScore: number, weeklyScore: number, monthlyScore: number, globalScore: number } | null> = this.scoresSubject.asObservable();
    public activity$: Observable<Activity[]> = this.activitySubject.asObservable();
    public lastCompletedExercise$: Observable<string | null> = this.lastCompletedExerciseSubject.asObservable();
    
    constructor(private http: HttpClient, private auth: Auth, private translate: TranslateService) {
        this.checkAuthState();
    }
    
    private checkAuthState() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.loggedInSubject.next(true);
                this.loadUserData();
            } else {
                this.loggedInSubject.next(false);
                this.clearUserData();
                this.userPhotoSubject.next('/assets/images/avatar.png');
                this.loadingSubject.next(false);
            }
        });
    }

    setLoggedInState(loggedIn: boolean): void { 
        this.loggedInSubject.next(loggedIn); 
    }
    
    async loadUserData(): Promise<void> {
        const user = this.auth.currentUser;
        
        if (user) {
            const token = await user.getIdToken();
            
            this.http.get<{ username: string, lastCompletedExercise: string, scores: { dailyScore: number, weeklyScore: number, monthlyScore: number, globalScore: number }, recentActivity: Activity[] }>(`${environment.apiUrl}/user/getUserData`, { 
                headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
                withCredentials: true 
            }).pipe(
                tap(response => {
                    this.usernameSubject.next(response.username);
                    this.scoresSubject.next(response.scores);
                    this.activitySubject.next(response.recentActivity);
                    this.lastCompletedExerciseSubject.next(response.lastCompletedExercise);
                }),
                take(1)
            ).subscribe({
                complete: () => this.loadingSubject.next(false),
                error: err => this.loadingSubject.next(false)
            });
            
            this.loadUserPhoto();
        }
    }
    
    private async loadUserPhoto() {
        const user = this.auth.currentUser;
        if (user) {
            const photoURL = user.photoURL || '/assets/images/avatar.png';
            this.userPhotoSubject.next(photoURL);
        }
    }

    async updateUsername(oldUsername: string, newUsername: string): Promise<void> {
        const user = this.auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            
            return this.http.put<{ message: string }>(`${environment.apiUrl}/user/updateUsername`, { oldUsername, newUsername, token }, {
                headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
                withCredentials: true
            }).toPromise().then(response => {
                this.usernameSubject.next(newUsername);
                this.setLastChangeDate(new Date());
                if (response) {
                    console.log(response.message);
                }
            }).catch(error => {
                const errorCode = error.error.code;
                const days = error.error.days;
                let errorMessage = this.translate.instant(`profile.profile-settings.${errorCode}`);
                if (errorCode === 'DAYS_REMAINING' && days) {
                    errorMessage = `${days} ${this.translate.instant('profile.profile-settings.delayError')}`;
                }
                
                throw new Error(errorMessage);
            });
        } else {
            throw new Error(this.translate.instant('profile.profile-settings.USER_NOT_LOGGED_IN'));
        }
    }
    
    
    setLastChangeDate(date: Date): void {
        localStorage.setItem(this.lastChangeDateKey, date.toISOString());
    }
    
    getLastChangeDate(): Date | null {
        const dateStr = localStorage.getItem(this.lastChangeDateKey);
        return dateStr ? new Date(dateStr) : null;
    }
    
    updateScores(scores: { dailyScore: number, weeklyScore: number, monthlyScore: number, globalScore: number }): void {
        this.scoresSubject.next(scores);
    }
    
    updateActivity(activity: Activity): void {
        const currentActivity = this.activitySubject.value;
        this.activitySubject.next([...currentActivity, activity]);
    }
    
    updateLastCompletedExercise(date: string): void {
        this.lastCompletedExerciseSubject.next(date);
    }
    
    getCurrentFeedback(date: string): string {
        const activity = this.activitySubject.value.find(act => moment(act.date).tz('America/Mexico_City').format('YYYY-MM-DD') === date);
        return activity?.feedback || '';
    }
    
    getScores(): { dailyScore: number, weeklyScore: number, monthlyScore: number, globalScore: number } | null {
        return this.scoresSubject.value;
    }
    
    clearUserData(): void {
        this.clearUsername();
        this.clearScores();
        this.clearActivity();
        this.clearLastCompletedExercise();
    }
    
    clearUsername(): void {
        this.usernameSubject.next(null);
    }
    
    clearScores(): void {
        this.scoresSubject.next(null);
    }
    
    clearActivity(): void {
        this.activitySubject.next([]);
    }
    
    clearLastCompletedExercise(): void {
        this.lastCompletedExerciseSubject.next(null);
    }
}
