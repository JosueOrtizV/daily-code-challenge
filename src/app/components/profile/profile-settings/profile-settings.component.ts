import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FirebaseError } from '@firebase/util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileSettingsComponent implements OnInit, OnDestroy {
  newUsername: string = '';
  username: string = '';
  showModal: boolean = false;
  message: string = '';
  googleLinked: boolean = false;
  gitHubLinked: boolean = false;
  googleEmail: string | null = null;
  gitHubEmail: string | null = null;
  usernameWarningMessage: string = '';
  linkWarningMessage: string = '';
  confirmMessage: string = '';
  messageVisible: boolean = false;
  loggedIn: boolean = false;
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private UserService: UserService,
    private authService: AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.UserService.username$
    .pipe(takeUntil(this.destroy$))
    .subscribe(username => {
      this.username = username || '';
    });

    this.UserService.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loggedIn => {
        this.loggedIn = loggedIn;
        this.checkLinkedAccounts();
      });

    this.UserService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async checkLinkedAccounts(): Promise<void> {
    this.googleLinked = await this.authService.isGoogleLinked();
    this.gitHubLinked = await this.authService.isGitHubLinked();
    this.googleEmail = await this.authService.getLinkedEmail('google.com');
    this.gitHubEmail = await this.authService.getLinkedEmail('github.com');
  }

  displayMessage() {
    this.messageVisible = true;
    this.cdr.detectChanges();  // Forzar la detección de cambios

    setTimeout(() => {
      this.messageVisible = false;
      this.cdr.detectChanges();  // Forzar la detección de cambios
    }, 4000);
  }

  async linkGoogleAccount(): Promise<void> {
    try {
      await this.authService.linkGoogleAccount();
      await this.checkLinkedAccounts();
      this.linkWarningMessage = this.translate.instant('profile.profile-settings.googleAccountLinked');
    } catch (error) {
      this.handleLinkError(error);
    }
    this.displayMessage();
  }

  async linkGitHubAccount(): Promise<void> {
    try {
      await this.authService.linkGitHubAccount();
      await this.checkLinkedAccounts();
      this.linkWarningMessage = this.translate.instant('profile.profile-settings.githubAccountLinked');
    } catch (error) {
      this.handleLinkError(error);
    }
    this.displayMessage();
  }

  handleLinkError(error: any) {
    if (error instanceof FirebaseError && error.code === 'auth/credential-already-in-use') {
      this.linkWarningMessage = this.translate.instant('profile.profile-settings.credentialAlreadyInUse');
    } else {
      this.linkWarningMessage = this.translate.instant('profile.profile-settings.unknownError');
    }
  }

  showChangeNameConfirm(): void {
    this.showModal = true;
  }

  hideChangeNameConfirm(): void {
    this.showModal = false;
  }

  async confirmChangeName(): Promise<void> {
    this.hideChangeNameConfirm();
    const username = this.authService.normalizeUsername(this.newUsername.trim());
    
    if (!username) {
      this.usernameWarningMessage = this.translate.instant('profile.profile-settings.usernameRequired');
      this.displayMessage();
      return;
    }
    
    const regex = /^[a-zA-Z0-9_.-]{4,16}$/;
    if (!regex.test(username)) {
      this.usernameWarningMessage = this.translate.instant('profile.profile-settings.usernameRules');
      this.displayMessage();
      return;
    }

    try {
      const isAvailable = await this.authService.checkUsernameAvailability(username);
      if (isAvailable) {
        await this.updateUsername(username);
      } else {
        this.usernameWarningMessage = this.translate.instant('profile.profile-settings.usernameInUse', { username });
        this.displayMessage();
      }
    } catch (error) {
      this.usernameWarningMessage = this.translate.instant('profile.profile-settings.unknownError');
      this.displayMessage();
    }
  }

  async updateUsername(username: string): Promise<void> {
    const oldUsername = this.username;
    try {
      await this.UserService.updateUsername(oldUsername, username);
      this.message = this.translate.instant('profile.profile-settings.savedMessage') + ' ' + username;
      this.displayMessage();
    } catch (error) {
      
      this.usernameWarningMessage = this.translate.instant('profile.profile-settings.unknownError');
      if (error instanceof Error) {
        this.usernameWarningMessage = error.message;
        this.displayMessage();
      }
    }
  }

  handleUpdateError(error: any): void {
    const errorMsg = error instanceof HttpErrorResponse && error.error.message;
    if (errorMsg && errorMsg.includes('days')) {
      const splitMessage = errorMsg.split(' ');
      this.usernameWarningMessage = splitMessage[0] + this.translate.instant('profile.profile-settings.delayError');
    } else {
      this.usernameWarningMessage = this.translate.instant('profile.profile-settings.unknownError');
    }
    this.displayMessage();
  }
}
