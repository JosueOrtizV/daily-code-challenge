import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginService } from '../../../core/services/login.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-username',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class UsernameComponent implements OnInit, OnDestroy {
  username: string = '';
  loggedIn: boolean = false;
  loading: boolean = true;
  showLoginModal: boolean = false;
  private destroy$ = new Subject<void>();
  private errorSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.userService.username$.pipe(takeUntil(this.destroy$)).subscribe(username => {
      this.username = username || '';
    });
    this.userService.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });
    this.userService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.hideLoginConfirm(); // Oculta el modal de confirmación
    try {
      await this.loginService.loginAnonymously(this.username);
      this.errorSubject.next(null);
      this.displaySavedMessage();
    } catch (error) {
      let errorMsg = this.translate.instant('login.error_anonymous_login');
      if (error instanceof Error) {
        errorMsg = this.translate.instant(error.message, { username: this.username });
      }
      this.setTemporaryError(this.errorSubject, errorMsg);
    }
  }

  displaySavedMessage(): void {
    const parentElement = document.getElementById('username-input-logged') as HTMLDivElement;
    const savedMessage = document.createElement('span');
    savedMessage.className = 'saved-message';
    savedMessage.textContent = this.translate.instant('dailyChallenge.username.savedMessage');
    parentElement.appendChild(savedMessage);

    setTimeout(() => {
      this.removeSavedMessage(parentElement);
    }, 3000);
  }

  removeSavedMessage(parentElement: HTMLElement): void {
    const savedMessage = parentElement.querySelectorAll('.saved-message');
    savedMessage.forEach(message => message.remove());
  }
}
