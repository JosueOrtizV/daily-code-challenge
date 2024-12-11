import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Subscription, Subject, Observable, of } from 'rxjs';
import { debounceTime, finalize, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [TranslateModule, CommonModule],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.css']
})
export class RankingComponent implements OnInit, OnDestroy {
  leaderboard: any[] = [];
  filter: string = 'global';
  username: string | null = '';
  loggedIn: boolean = false;
  userRank: any = {};
  token: string | null = '';
  loading: boolean = false;
  private subscriptions = new Subscription();
  private filterSubject = new Subject<string>();
  private cache: { [key: string]: any } = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private UserService: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.filterSubject.pipe(
      debounceTime(500),
      switchMap(filter => this.loadLeaderboardAndUserRank(filter).pipe(
        catchError(error => {
          console.error('Error loading leaderboard and user rank:', error);
          return of([]);
        })
      ))
    ).subscribe();

    this.initializeData();

    this.subscriptions.add(
      this.UserService.loggedIn$.subscribe(loggedIn => {
        this.loggedIn = loggedIn;
        if (!loggedIn) {
          this.loadLeaderboardAndUserRank(this.filter).subscribe();
        }
      })
    );

    this.subscriptions.add(
      this.translate.onLangChange.subscribe(() => {
        this.loadLeaderboardAndUserRank(this.filter).subscribe();
      })
    );

    this.subscriptions.add(
      this.UserService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeData(): void {
    this.authService.getUserToken().then(token => {
      if (token) {
        this.token = token;
        this.loggedIn = true;
        this.subscriptions.add(
          this.UserService.username$.subscribe(username => {
            this.username = username;
          })
        );
      }
      this.loadLeaderboardAndUserRank(this.filter).subscribe();
    }).catch(error => {
      console.error('Error getting user token:', error);
      this.loadLeaderboardAndUserRank(this.filter).subscribe();
    });
  }

  changeFilter(filter: string): void {
    if (this.filter !== filter) {
      this.filter = filter;
      this.filterSubject.next(filter);
    }
  }

  private loadLeaderboardAndUserRank(filter: string): Observable<any> {
    if (this.loading) return of();
    this.loading = true;

    const cacheKey = `${filter}-${this.token}`;
    if (this.cache[cacheKey]) {
      this.leaderboard = this.cache[cacheKey].leaderboard;
      this.userRank = this.cache[cacheKey].userRank;
      this.loading = false;
      return of([]);
    }

    const headers = this.token ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`) : undefined;
    return this.http.get<{ status: string, leaderboard: any[], userRank: any }>(`${environment.apiUrl}/leaderboardAndUserRank?filter=${filter}`, { headers })
      .pipe(
        finalize(() => this.loading = false),
        switchMap(response => {
          if (response.status === 'success') {
            this.leaderboard = response.leaderboard || [];
            this.userRank = response.userRank || {};
            this.cache[cacheKey] = { leaderboard: this.leaderboard, userRank: this.userRank };

            const userInLeaderboard = this.leaderboard.some(user => user?.username === this.userRank?.username);

            if (!userInLeaderboard && this.userRank?.rank) {
              this.leaderboard.push(this.userRank);
              this.leaderboard.sort((a, b) => a.rank - b.rank);
            }
          } else {
            console.error('loadLeaderboardAndUserRank error response', response);
          }
          return of([]);
        })
      );
  }
}
