import { Component, AfterViewInit, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine, lineNumbers, ViewUpdate } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap } from '@codemirror/commands';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment-timezone';
import { UserService } from '../../../core/services/user.service';
import { environment } from '../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-checkcode',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatProgressSpinnerModule],
  templateUrl: './check-code.component.html',
  styleUrls: ['./check-code.component.css'],
})
export class CheckCodeComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('checkcode') checkcode!: ElementRef<HTMLDivElement>;
  @ViewChild('completed') completed!: ElementRef<HTMLDivElement>;
  @Input() difficulty!: string;
  @Input() username!: string | null;
  @Input() token!: string;
  @Input() language!: string;
  @Input() loggedIn!: boolean;
  editor: EditorView | undefined;
  maxCharacters: number = 1500;
  feedback: string = '';
  checkingMessage: string = '';
  userCode: string = '';
  isCheckingCode: boolean = false;
  messageVisible: boolean = false;
  completedDisplay: boolean = false;
  loading: boolean = true;
  score: number = 0;
  globalScore: number = 0;
  timeUntilNextChallenge: string = '';
  private destroy$ = new Subject<void>();
  private errorSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();
  
  constructor(
    private renderer: Renderer2,
    private http: HttpClient,
    private translate: TranslateService,
    private UserService: UserService
  ) {}
  
  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateMessages();
    });
    this.updateMessages();
    
    this.checkCompletionStatus();
    
    this.UserService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => { 
      this.loading = loading; 
    });
  }
  
  private checkCompletionStatus(): void {
    this.UserService.lastCompletedExercise$.pipe(takeUntil(this.destroy$)).subscribe(lastCompletedExercise => {
      const today = moment().tz('America/Mexico_City').format('YYYY-MM-DD');
      if (lastCompletedExercise === today) {
        this.completedDisplay = true;
        this.feedback = this.UserService.getCurrentFeedback(today);
        const scores = this.UserService.getScores();
        this.score = scores ? scores.dailyScore : 0;
        this.globalScore = scores ? scores.globalScore : 0;
        this.calculateTimeUntilNextChallenge();
      } else {
        this.completedDisplay = false;
      }
    });
  }
  
  ngAfterViewInit() {
    if (this.checkcode) {
      this.initializeCodeMirror();
    }
  }
  
  ngOnDestroy(): void {
    this.editor?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  initializeCodeMirror(): void {
    this.editor = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          javascript(),
          lineNumbers(),
          highlightActiveLine(),
          keymap.of(defaultKeymap),
          vscodeLight,
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) {
              this.handleCharacterLimit(update.state.doc);
              this.userCode = update.state.doc.toString();
            }
          })
        ],
      }),
      parent: this.checkcode.nativeElement,
    });
  }
  
  handleCharacterLimit(doc: any): void {
    const content = doc.toString();
    if (content.length > this.maxCharacters) {
      this.editor?.dispatch({
        changes: { from: this.maxCharacters, to: content.length }
      });
      this.displayMessage();
      this.checkcode.nativeElement.focus();
      this.checkcode.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.setTemporaryError(this.translate.instant('dailyChallenge.checkCode.messages.maxCharacters', { maxCharacters: this.maxCharacters }));
    }
  }
  
  displayMessage() {
    this.messageVisible = true;
    setTimeout(() => {
      if (this.messageVisible) {
        this.messageVisible = false;
      }
    }, 4000);
  }
  
  private setTemporaryError(message: string) {
    this.errorSubject.next(message);
    setTimeout(() => {
      this.errorSubject.next(null);
    }, 5000);
  }
  
  async checkCode() {
    this.isCheckingCode = true;
    const token = this.token;
    const username = this.username;
    const difficulty = this.difficulty;
    const language = this.language;
    
    if (!this.loggedIn) {
      this.setTemporaryError(this.translate.instant('dailyChallenge.messages.validUsernameOrLogin'));
      this.isCheckingCode = false;
      return;
    }
    
    if (!this.userCode.trim()) {
      this.setTemporaryError(this.translate.instant('dailyChallenge.checkCode.messages.enterValidCode'));
      this.isCheckingCode = false;
      return;
    }
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = { username, difficulty, userCode: this.userCode, language };
    
    this.checkingMessage = this.translate.instant('dailyChallenge.checkCode.messages.checkingCode');
    try {
      const response: any = await this.http.post(`${environment.apiUrl}/checkCode`, body, { headers }).toPromise();
      if (response.status === 'success') {
        console.log(response);
        
        this.feedback = response.feedback;
        this.score = response.score;
        this.globalScore = response.globalScore;
        this.completedDisplay = true;
        this.checkcode.nativeElement.focus();
        this.checkcode.nativeElement.scrollIntoView({ behavior: 'smooth' });
        this.editor?.destroy();
        this.UserService.loadUserData();
        this.calculateTimeUntilNextChallenge();
      } else {
        this.setTemporaryError(response.message);
        this.completedDisplay = false;
        this.isCheckingCode = false;
      }
    } catch (error: any) {
      let errorMsg = this.translate.instant('dailyChallenge.checkCode.messages.errorCheckingCode');
      if (error instanceof HttpErrorResponse) {
        if (error.status === 503) {
          errorMsg = this.translate.instant('dailyChallenge.checkCode.messages.serviceOverloaded');
        } else if (error.error && error.error.message) {
          errorMsg = this.translate.instant('dailyChallenge.checkCode.messages.errorCheckingCode', { errorMessage: error.error.message });
          console.log(errorMsg);
          
        } else {
          errorMsg = this.translate.instant('dailyChallenge.checkCode.messages.errorCheckingCode');
        }
      } else {
        errorMsg = this.translate.instant('dailyChallenge.checkCode.messages.errorCheckingCode');
      }
      this.setTemporaryError(errorMsg);
      this.feedback = '';
    } finally {
      this.isCheckingCode = false;
    }
  }
  
  private calculateTimeUntilNextChallenge(): void {
    const nextChallengeTime = moment().tz('America/Mexico_City').endOf('day');
    const now = moment().tz('America/Mexico_City');
    const duration = moment.duration(nextChallengeTime.diff(now));
    
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    this.timeUntilNextChallenge = `${hours}h ${minutes}m`;
    
    setInterval(() => {
      const now = moment().tz('America/Mexico_City');
      const duration = moment.duration(nextChallengeTime.diff(now));
      
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      
      this.timeUntilNextChallenge = `${hours}h ${minutes}m`;
    }, 1000);
  }
  
  private updateMessages(): void {
    this.checkingMessage = this.translate.instant('dailyChallenge.checkCode.messages.checkingMessage');
  }
}

