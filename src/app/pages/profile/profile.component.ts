import { Component, OnInit, HostListener, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WINDOW } from '../../core/utilities/window.token'; 

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  username: string | null = '';
  userPhoto: string | null = '/assets/images/avatar.png';
  showModal: boolean = false;
  loggedIn: boolean = false;
  loading: boolean = true;
  isDesktop: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private UserService: UserService,
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    @Inject(WINDOW) private window: Window
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.UserService.username$,
      this.UserService.userPhoto$,
      this.UserService.loggedIn$,
      this.UserService.loading$
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([username, userPhoto, loggedIn, loading]) => {
        this.username = username;
        this.userPhoto = userPhoto || '/assets/images/avatar.png';
        this.loggedIn = loggedIn;
        this.loading = loading;
      });

    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isDesktop = this.window.innerWidth > 768;
  }

  showLogoutConfirm(): void {
    this.showModal = true;
  }

  hideLogoutConfirm(): void {
    this.showModal = false;
  }

  confirmLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
