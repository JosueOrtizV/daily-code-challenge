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
  filter: string = 'global'; // Default filter
  username: string | null = '';
  loggedIn: boolean = false;
  userRank: any = {};
  token: string | null = '';
  loading: boolean = false; // Controls the loading state
  private subscriptions = new Subscription();
  private filterSubject = new Subject<string>();
  private cache: { [key: string]: any } = {}; // Cache for leaderboard data

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private UserService: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Observe filter changes and trigger leaderboard reload
    this.filterSubject.pipe(
      debounceTime(500),
      switchMap(filter => this.loadLeaderboardAndUserRank(filter).pipe(
        catchError(error => {
          console.error('Error loading leaderboard and user rank:', error);
          return of([]);
        })
      ))
    ).subscribe();

    // Initialize data and ensure token/authentication is ready before making API calls
    this.initializeData();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to avoid memory leaks
    this.subscriptions.unsubscribe();
  }

  private initializeData(): void {
    let initialRequestPending = true;
  
    this.authService.getUserToken().then(token => {
      if (token) {
        this.token = token;
        this.loggedIn = true;
  
        this.subscriptions.add(
          this.UserService.username$.subscribe(username => {
            this.username = username;
          })
        );
  
        // Load leaderboard after token is set
        this.loadLeaderboardAndUserRank(this.filter).subscribe(() => {
          initialRequestPending = false; // Initial request completed
        });
      } else {
        console.warn('No token found, loading leaderboard as unauthenticated user.');
        this.loadLeaderboardAndUserRank(this.filter).subscribe(() => {
          initialRequestPending = false; // Initial request completed
        });
      }
    }).catch(error => {
      console.error('Error getting user token:', error);
      this.loadLeaderboardAndUserRank(this.filter).subscribe(() => {
        initialRequestPending = false; // Initial request completed
      });
    });
  
    // If API requests are skipped initially, retry after initialization
    const retryInterval = setInterval(() => {
      if (!initialRequestPending && this.loading) {
        this.loading = false; // Reset loading to allow further requests
        clearInterval(retryInterval);
      }
    }, 100); // Retry every 100ms until initial request completes
  }

  changeFilter(filter: string): void {
    if (this.filter !== filter) {
      this.filter = filter;
      this.filterSubject.next(filter); // Trigger leaderboard reload for the new filter
    }
  }

  private loadLeaderboardAndUserRank(filter: string): Observable<any> {
    if (this.loading) {
      console.warn('Loading in progress, skipping leaderboard request.');
      return of([]); // Prevent multiple simultaneous requests
    }
    this.loading = true;

    const cacheKey = `${filter}-${this.token || 'guest'}`; // Include token in the cache key for uniqueness
    if (this.cache[cacheKey]) {
      console.info('Using cached leaderboard data', { filter, cacheKey });
      this.leaderboard = this.cache[cacheKey].leaderboard;
      this.userRank = this.cache[cacheKey].userRank;
      this.loading = false; // No need to load from API if cache exists
      return of([]);
    }

    const headers = this.token ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`) : undefined;

    return this.http.get<{ status: string, leaderboard: any[], userRank: any }>(`${environment.apiUrl}/leaderboardAndUserRank?filter=${filter}`, { headers })
      .pipe(
        finalize(() => this.loading = false), // Always stop loading after API response
        switchMap(response => {
          if (response.status === 'success') {

            this.leaderboard = response.leaderboard || [];
            this.userRank = response.userRank || {};
            this.cache[cacheKey] = { leaderboard: this.leaderboard, userRank: this.userRank }; // Cache the response

            const userInLeaderboard = this.leaderboard.some(user => user?.username === this.userRank?.username);

            // Add user rank to leaderboard if not already present
            if (!userInLeaderboard && this.userRank?.rank) {
              this.leaderboard.push(this.userRank);
              this.leaderboard.sort((a, b) => a.rank - b.rank); // Ensure correct order
            }
          } else {
            console.error('Error in leaderboard API response:', response);
          }
          return of([]);
        })
      );
  }
}