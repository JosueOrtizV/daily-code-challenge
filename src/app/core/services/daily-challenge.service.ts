import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import moment from 'moment-timezone';

@Injectable({
    providedIn: 'root'
})
export class DailyChallengeService {
    private apiUrl = environment.apiUrl + '/getDailyChallenge';

    constructor(private http: HttpClient) {}

    getDailyChallenges(language: string): Observable<any> {
        const storedChallenges = localStorage.getItem('dailyChallenges');
        const storedDate = localStorage.getItem('dailyChallengesDate');
        
        const today = moment().tz('America/Mexico_City').startOf('day').toDate();
        const todayStr = moment(today).format('YYYY-MM-DD');


        if (storedChallenges) {
            try {
                const allChallenges = JSON.parse(storedChallenges);
                if (storedDate === todayStr && allChallenges[language]) {
                    return of(allChallenges[language]);
                }
            } catch (error) {
                console.error('Error parsing stored challenges:', error);
            }
        }

        const headers = new HttpHeaders().set('Content-Language', language);
        return this.http.get<{ status: string, challenge: any }>(this.apiUrl, { headers }).pipe(
            map(response => response.challenge),
            tap(challenges => {
                const allChallenges = JSON.parse(localStorage.getItem('dailyChallenges') || '{}');
                allChallenges[language] = challenges;
                localStorage.setItem('dailyChallenges', JSON.stringify(allChallenges));
                localStorage.setItem('dailyChallengesDate', todayStr);
            })
        );
    }
}
