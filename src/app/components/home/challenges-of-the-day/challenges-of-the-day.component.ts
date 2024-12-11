import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DailyChallengeService } from '../../../core/services/daily-challenge.service';
import { LanguageService } from '../../../core/services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-challenges-of-the-day',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './challenges-of-the-day.component.html',
  styleUrls: ['./challenges-of-the-day.component.css']
})
export class ChallengesOfTheDayComponent implements OnInit, OnDestroy {
  dailyChallenges: any = {
    easy: '',
    intermediate: '',
    hard: '',
    extreme: ''
  };
  loading: boolean = true;
  language: string = 'en';
  private destroy$ = new Subject<void>();

  constructor(
    private dailyChallengeService: DailyChallengeService,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.language = this.languageService.getLanguage();
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.language = this.languageService.getLanguage();
      this.loadDailyChallenges();
    });
    this.loadDailyChallenges();
  }

  loadDailyChallenges() {
    if (!localStorage.getItem('dailyChallenges')) {
      this.loading = true;
    }

    this.dailyChallengeService.getDailyChallenges(this.language).subscribe(
      challenges => {
        this.dailyChallenges = {
          easy: challenges.easy[this.language]?.Title || '',
          intermediate: challenges.intermediate[this.language]?.Title || '',
          hard: challenges.hard[this.language]?.Title || '',
          extreme: challenges.extreme[this.language]?.Title || ''
        };
        this.loading = false;
      },
      error => {
        console.error('Error fetching daily challenges:', error);
        this.loading = false;
      }
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
