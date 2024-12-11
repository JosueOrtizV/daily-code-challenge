import { Component, AfterViewInit, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UsernameComponent } from "../../components/daily-challenge/username/username.component";
import { LanguageService } from '../../core/services/language.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-more-challenges',
  standalone: true,
  imports: [CommonModule, HttpClientModule, UsernameComponent, TranslateModule, MatProgressSpinnerModule],
  templateUrl: './more-challenges.component.html',
  styleUrls: ['./more-challenges.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MoreChallengesComponent implements OnInit, AfterViewInit {
  @ViewChild('exerciseTextarea') exerciseTextarea!: ElementRef<HTMLDivElement>;
  exercise: string = ''; 
  showCopyButton: boolean = false;
  placeholder: string = '';
  showUsernameInput: boolean = true;
  username: string | null = '';
  loggedIn: boolean = false;
  language: string = 'en';
  loading: boolean = true;
  date: Date = new Date();
  token: string = '';
  difficulty: string = 'easy';
  warningMessage: string = '';
  checkingMessage: string = '';
  messageVisible: boolean = false;
  loadingChallenge: boolean = false;

  constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private UserService: UserService, 
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.language = this.languageService.getLanguage();
    this.translate.use(this.language);
    this.updatePlaceholder();

    this.translate.onLangChange.subscribe(() => {
      this.exercise = '';
      this.updatePlaceholder();
    });

    this.UserService.username$.subscribe(username => { 
      this.username = username; 
    });
    this.UserService.loggedIn$.subscribe(async loggedIn => {
      this.loggedIn = loggedIn; 
      if (!loggedIn) {
        this.placeholder = this.translate.instant('moreChallenges.messages.validUsernameOrLogin');
        this.exercise = ''; 
      } else {
        await this.getToken();
        this.placeholder = this.translate.instant('moreChallenges.messages.placeholder');
        this.exercise = '';
      }
    });
    this.UserService.loading$.subscribe(loading => { 
      this.loading = loading; 
    });
  }

  ngAfterViewInit() {
    if (this.exerciseTextarea) {
      this.adjustTextarea(this.exerciseTextarea.nativeElement);
    }
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
    this.placeholder = this.translate.instant('moreChallenges.messages.placeholder');
  }

  async getToken(): Promise<string | null> {
    const token = await this.authService.getUserToken();
    if (token) {
      this.token = token;
    }
    return token;
  }

  async getChallenge() {
    this.loadingChallenge = true;
    if (!this.loggedIn) {
      this.warningMessage = this.translate.instant('moreChallenges.messages.validUsernameOrLogin');
      this.displayMessage();
      this.showUsernameInput = true;
      this.loadingChallenge = false;
      return;
    }

    if (!this.token) {
      await this.getToken();
    }
    if (!this.token) {
      this.loadingChallenge = false;
      this.warningMessage = this.translate.instant('moreChallenges.messages.errorGettingChallenge');
      this.displayMessage();
      return;
    }

    const difficulty = (document.getElementById('difficulty') as HTMLSelectElement).value;
    this.difficulty = difficulty;
    this.language = this.languageService.getLanguage();

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    const body = {
      username: this.username,
      difficulty: this.difficulty,
      language: this.language
    };

    this.http.post<{ status: string, challenge: any }>(`${environment.apiUrl}/getMoreChallenges`, body, { headers })
    .subscribe(response => {
      this.loadingChallenge = false;
      if (response.status === 'success') {
        const challenge = response.challenge;
        this.exerciseTextarea.nativeElement.innerHTML = `<p>${challenge}</p>`;
        this.showCopyButton = true;
        this.exerciseTextarea.nativeElement.classList.add('has-content');
        setTimeout(() => {
          if (this.exerciseTextarea) {
            this.adjustTextarea(this.exerciseTextarea.nativeElement);
          }
        }, 50);
      }
    }, error => {
      this.loadingChallenge = false;
      this.exercise = '';
      this.warningMessage = error.error.message || this.translate.instant('moreChallenges.messages.errorGettingChallenge');
      this.displayMessage();
    });
  }

  displayMessage() {
    this.messageVisible = true;
    setTimeout(() => {
      this.messageVisible = false;
    }, 4000);
  }

  copy(tooltip: HTMLElement): void {
    const div = this.exerciseTextarea.nativeElement;
    const text = div.innerText || div.textContent || ''; 
    navigator.clipboard.writeText(text).then(() => {
      tooltip.textContent = this.translate.instant('moreChallenges.messages.copiedToClipboard');
      setTimeout(() => {
        tooltip.textContent = this.translate.instant('moreChallenges.messages.clickToCopy');
      }, 1000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }
}
