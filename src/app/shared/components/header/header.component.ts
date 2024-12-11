import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import { UserService } from '../../../core/services/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isTogglerActive = false;
  isSticky = false;
  loggedIn: boolean = false;
  loading: boolean = true;
  activeUrl: string;
  language: string = 'en';
  private destroy$ = new Subject<void>();
  showMoreOptions = false;

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private translate: TranslateService,
    private UserService: UserService
  ) {
    this.activeUrl = this.router.url;
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.activeUrl = event.url;
        window.scrollTo(0, 0);
      });
  }

  ngOnInit() {
    this.UserService.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });
    this.UserService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });
    this.language = this.languageService.getLanguage();
    this.updateLanguageSwitcher(this.language);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTogglerClick() {
    this.isTogglerActive = !this.isTogglerActive;
  }

  closeToggler() {
    this.isTogglerActive = false;
  }

  @HostListener('window:scroll', [])
  onScroll() {
    const stickyPoint = 100;
    this.isSticky = window.pageYOffset >= stickyPoint;
  }

  toggleLanguage() {
    const newLang = this.language === 'en' ? 'es' : 'en';
    this.languageService.setLanguage(newLang);
    this.language = newLang;
    this.updateLanguageSwitcher(newLang);
  }

  updateLanguageSwitcher(lang: string) {
    const toggleBtn = document.getElementById('toggle-btn') as HTMLInputElement;
    if (toggleBtn) {
      toggleBtn.checked = lang === 'es';
    }
  }

  toggleMoreOptions() {
    this.showMoreOptions = !this.showMoreOptions;
  }
}
