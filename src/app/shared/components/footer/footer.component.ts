import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollTopComponent } from "../scroll-top/scroll-top.component";
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, ScrollTopComponent, RouterModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  loggedIn: boolean = false;
  warningMessage: string = '';
  messageVisible: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private translate: TranslateService,
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
      this.warningMessage = this.translate.instant('footer.contactForm.loginWarning');
      this.displayMessage();
      return;
    }

    const token = await this.authService.getUserToken();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = { email, message };

    this.http.post(`${environment.apiUrl}/user/contact`, body, { headers }).subscribe(
      response => {
        this.warningMessage = this.translate.instant('footer.contactForm.successMessage');
        this.displayMessage();
        form.reset();
      },
      error => {
        this.warningMessage = this.translate.instant('footer.contactForm.errorMessage');
        this.displayMessage();
      }
    );
  }
}
