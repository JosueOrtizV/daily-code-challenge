import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { LoginService } from '../../core/services/login.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, HttpClientModule, FormsModule, TranslateModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  username: string = '';
  loggedIn: boolean = false;
  loading: boolean = true;
  countdownMessage: string = '';
  showLoginModal: boolean = false;
  private destroy$ = new Subject<void>();
  private countdownTimeout?: any;
  private errorAnonymousSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private errorGoogleSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private errorGithubSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  errorAnonymous$ = this.errorAnonymousSubject.asObservable();
  errorGoogle$ = this.errorGoogleSubject.asObservable();
  errorGithub$ = this.errorGithubSubject.asObservable();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private loginService: LoginService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });
    this.userService.username$.pipe(takeUntil(this.destroy$)).subscribe(username => { 
      this.username = username || ''; 
    });
    this.userService.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(loggedIn => { 
      this.loggedIn = loggedIn; 
      if (loggedIn) {
        this.startCountdown();
      } else {
        this.cancelCountdown();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelCountdown();
  }

  private startCountdown() {
    let countdown = 10;
    this.countdownMessage = this.translate.instant('login.redirect_message', { seconds: countdown });

    this.countdownTimeout = setInterval(() => {
      countdown -= 1;
      this.countdownMessage = this.translate.instant('login.redirect_message', { seconds: countdown });

      if (countdown === 0) {
        clearInterval(this.countdownTimeout);
        this.router.navigate(['/daily-challenge']);
      }
    }, 1000);
  }

  private cancelCountdown() {
    if (this.countdownTimeout) {
      clearInterval(this.countdownTimeout);
      this.countdownMessage = '';
    }
  }

  private setTemporaryError(subject: BehaviorSubject<string | null>, message: string) {
    subject.next(message);
    setTimeout(() => {
      subject.next(null);
    }, 5000);
  }

  showLoginConfirm(): void {
    this.showLoginModal = true;
  }

  hideLoginConfirm(): void {
    this.showLoginModal = false;
  }

  async confirmLogin() {
    this.hideLoginConfirm();
    try {
        await this.loginService.loginAnonymously(this.username);
        this.errorAnonymousSubject.next(null);
        this.userService.setLoggedInState(true);
    } catch (error) {
        let errorMsg = this.translate.instant('login.error_anonymous_login');
        if (error instanceof Error) {
            errorMsg = this.translate.instant(error.message, { username: this.username });
        }
        this.setTemporaryError(this.errorAnonymousSubject, errorMsg);
        this.userService.setLoggedInState(false);
    }
}

async loginWithGoogle() {
    try {
        await this.authService.loginWithGoogle();
        this.loggedIn = true;
        this.errorGoogleSubject.next(null);
        this.userService.setLoggedInState(true);
    } catch (error) {
        const errorMsg = this.translate.instant('login.error_google_login');
        this.setTemporaryError(this.errorGoogleSubject, errorMsg);
        this.userService.setLoggedInState(false);
    }
}

async loginWithGithub() {
    try {
        await this.authService.loginWithGithub();
        this.loggedIn = true;
        this.errorGithubSubject.next(null);
        this.userService.setLoggedInState(true);
    } catch (error) {
        const errorMsg = this.translate.instant('login.error_github_login');
        this.setTemporaryError(this.errorGithubSubject, errorMsg);
        this.userService.setLoggedInState(false);
    }
}

}
