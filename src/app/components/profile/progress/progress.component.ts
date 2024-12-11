import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LanguageService } from '../../../core/services/language.service';
import { RouterModule } from '@angular/router';
import moment from 'moment-timezone';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit, OnDestroy {
  username: string = '';
  scores = { dailyScore: 0, weeklyScore: 0, monthlyScore: 0, globalScore: 0 };
  recentActivity: { date: string, challengeEN: string, challengeES: string, statusEN: string, statusES: string, points: number, localDate: string }[] = [];
  challengeCompleted: boolean = false;
  private destroy$ = new Subject<void>();
  language: string = 'en';

  constructor(
    private UserService: UserService,
    private translate: TranslateService,
    private languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.language = this.languageService.getLanguage();

    this.translate.onLangChange.subscribe(() => {
      this.language = this.languageService.getLanguage();
    });

    this.UserService.username$
      .pipe(takeUntil(this.destroy$))
      .subscribe(username => {
        this.username = username || '';
      });

    this.UserService.scores$
      .pipe(takeUntil(this.destroy$))
      .subscribe(scores => {
        this.scores = scores || this.scores;
      });

    this.UserService.activity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activity => {
        if (Array.isArray(activity)) {
          this.recentActivity = activity
            .filter(act => !isNaN(new Date(act.date).getTime()))
            .map(act => ({
              date: this.formatActivityDate(act.date),
              localDate: this.formatLocalActivityDate(act.date),
              challengeEN: act.challengeEN,
              challengeES: act.challengeES,
              statusEN: act.statusEN,
              statusES: act.statusES,
              points: act.points
            }));
          this.checkDailyChallengeStatus();
        } else {
          this.recentActivity = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkDailyChallengeStatus(): void {
    const today = moment().tz('America/Mexico_City').format('YYYY-MM-DD');
    this.challengeCompleted = this.recentActivity.some(activity => {
      const activityDate = moment(activity.date).tz('America/Mexico_City').format('YYYY-MM-DD');
      return activity.statusEN === 'Completed' && activityDate === today;
    });
  }

  private formatActivityDate(date: string): string {
    return moment(date).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
  }

  private formatLocalActivityDate(date: string): string {
    return moment(date).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('YYYY-MM-DD HH:mm:ss');
  }
}
