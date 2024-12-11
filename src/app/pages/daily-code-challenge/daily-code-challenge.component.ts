import { Component, AfterViewInit, OnInit, ViewChild, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { DailyChallengeService } from '../../core/services/daily-challenge.service';
import { UsernameComponent } from "../../components/daily-challenge/username/username.component";
import { CheckCodeComponent } from "../../components/daily-challenge/check-code/check-code.component";
import { LanguageService } from '../../core/services/language.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment-timezone'; 

@Component({
  selector: 'app-daily-code-challenge',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, UsernameComponent, CheckCodeComponent, TranslateModule],
  templateUrl: './daily-code-challenge.component.html',
  styleUrls: ['./daily-code-challenge.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DailyCodeChallengeComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('exerciseTextarea') exerciseTextarea!: ElementRef<HTMLDivElement>;
  exercise: string = ''; 
  showCopyButton: boolean = false;
  placeholder: string = '';
  showUsernameInput: boolean = true;
  username: string | null = '';
  loggedIn: boolean = false;
  language: string = 'en';
  loading: boolean = true;
  token: string = '';
  difficulty: string = 'easy';
  fechaFormateada: string;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private UserService: UserService, 
    private dailyChallengeService: DailyChallengeService,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {
    const date = moment().tz('America/Mexico_City');
    this.fechaFormateada = date.format('DD/MM/YYYY');
  }

  ngOnInit(): void {
    this.language = this.languageService.getLanguage();
    this.translate.use(this.language);
    this.updatePlaceholder();

    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.exerciseTextarea.nativeElement.querySelector('h2')) {
        this.language = this.languageService.getLanguage();
        this.getChallenge();
      }
      this.updatePlaceholder();
    });

    this.UserService.username$.pipe(takeUntil(this.destroy$)).subscribe(username => { 
      this.username = username; 
    });

    this.UserService.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(async loggedIn => {
      this.loggedIn = loggedIn;
      if (!loggedIn) {
        this.placeholder = this.translate.instant('dailyChallenge.messages.validUsernameOrLogin');
        this.exercise = '';
      } else {
        await this.getToken();
        this.placeholder = this.translate.instant('dailyChallenge.messages.placeholder');
        this.exercise = '';
      }
    });

    this.UserService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => { 
      this.loading = loading; 
    });
  }

  ngAfterViewInit() {
    if (this.exerciseTextarea) {
      this.adjustTextarea(this.exerciseTextarea.nativeElement);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  adjustTextareaOnChange(): void {
    if (this.exerciseTextarea) {
      const textarea = this.exerciseTextarea.nativeElement;
      textarea.addEventListener('input', () => {
        this.adjustTextarea(textarea);
      });
    }
  }

  adjustTextarea(textarea: HTMLDivElement): void {
    textarea.style.height = 'auto';
  }

  updatePlaceholder(): void {
    this.placeholder = this.translate.instant('dailyChallenge.messages.placeholder');
  }

  async getToken(): Promise<string | null> {
    const token = await this.authService.getUserToken();
    if (token) {
      this.token = token;
    } else {
      console.error('No valid token found.');
    }
    return token;
  }

  async getChallenge() {
    if (!this.loggedIn) {
      this.exercise = this.translate.instant('dailyChallenge.messages.validUsernameOrLogin');
      this.showUsernameInput = true;
      return;
    }

    this.exercise = this.translate.instant('dailyChallenge.messages.loadingChallenge');

    if (!this.token) {
      await this.getToken();
    }
    if (!this.token) {
      this.exercise = this.translate.instant('dailyChallenge.messages.errorGettingChallenge');
      return;
    }

    this.dailyChallengeService.getDailyChallenges(this.language).pipe(takeUntil(this.destroy$)).subscribe(
      challenges => {
        const challenge = challenges[this.difficulty][this.language];
        const hints = `<h3 class="hint-toggle">${this.translate.instant('dailyChallenge.messages.showHints')}</h3><div class="hints-content" style="display: none;">${challenge.Hints}</div>`;
        this.exerciseTextarea.nativeElement.innerHTML =
          `<h2 style="text-align: center;">${challenge.Title}</h2>\n<h3>${this.translate.instant('dailyChallenge.exerciseTitle')}:</h3><p>${challenge.Exercise}</p>\n<h3>${this.translate.instant('dailyChallenge.examplesTitle')}:</h3><p>${challenge.Examples}</p>\n${hints}`;
        this.showCopyButton = true;
        this.exerciseTextarea.nativeElement.classList.add('has-content');
        this.addHintToggleEvent();
        setTimeout(() => {
          if (this.exerciseTextarea) {
            this.adjustTextarea(this.exerciseTextarea.nativeElement);
          }
        }, 50);
      },
      error => {
        if (error.status === 401) {
          this.exercise = this.translate.instant('dailyChallenge.messages.errorGettingChallenge');
          this.showUsernameInput = true;
        } else {
          this.exercise = this.translate.instant('dailyChallenge.messages.errorGettingChallenge');
        }
      }
    );
  }

  addHintToggleEvent(): void {
    const hintToggle = this.exerciseTextarea.nativeElement.querySelector('.hint-toggle');
    const hintsContent = this.exerciseTextarea.nativeElement.querySelector('.hints-content');
    if (hintToggle && hintsContent) {
      hintToggle.addEventListener('click', () => {
        const displayStyle = (hintsContent as HTMLElement).style.display === 'none' ? 'block' : 'none';
        (hintsContent as HTMLElement).style.display = displayStyle;
        hintToggle.textContent = displayStyle === 'none' ? this.translate.instant('dailyChallenge.messages.showHints') : this.translate.instant('dailyChallenge.messages.hideHints');
      });
    }
  }

  copy(tooltip: HTMLElement): void {
    const div = this.exerciseTextarea.nativeElement;
    const text = div.innerText || div.textContent || ''; 
    navigator.clipboard.writeText(text).then(() => {
      tooltip.textContent = this.translate.instant('dailyChallenge.messages.copiedToClipboard');
      setTimeout(() => {
        tooltip.textContent = this.translate.instant('dailyChallenge.messages.clickToCopy');
      }, 1000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }
}
