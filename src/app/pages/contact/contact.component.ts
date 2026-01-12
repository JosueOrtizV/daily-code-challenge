import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { CsrfService } from '../../core/services/csrf.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit, OnDestroy {
  loggedIn: boolean = false;
  warningMessage: string = '';
  messageVisible: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private translate: TranslateService,
    private csrfService: CsrfService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.userService.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loggedIn => {
        this.loggedIn = loggedIn;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayMessage() {
    this.messageVisible = true;
    setTimeout(() => {
      this.messageVisible = false;
    }, 4000);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.loggedIn) {
      this.warningMessage = this.translate.instant('contact.loginWarning');
      this.displayMessage();
      return;
    }

    const token = await this.authService.getUserToken();
    const form = event.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = { username, email, subject, message };
    await this.csrfService.getCsrfToken().toPromise();
    
    this.http.post(`${environment.apiUrl}/user/contact`, body, { headers }).subscribe(
      response => {
        this.warningMessage = this.translate.instant('contact.successMessage');
        this.displayMessage();
        form.reset();
      },
      error => {
        this.warningMessage = this.translate.instant('contact.errorMessage');
        this.displayMessage();
      }
    );
  }
}
