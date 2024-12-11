import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { RouterModule } from '@angular/router';

import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit, OnDestroy {
  username: string | null = '';
  loggedIn: boolean = false;
  loading: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private UserService: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.UserService.username$,
      this.UserService.loggedIn$,
      this.UserService.loading$
    ]).pipe(takeUntil(this.destroy$))
    .subscribe(([username, loggedIn, loading]) => {
      this.username = username;
      this.loggedIn = loggedIn;
      this.loading = loading;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
