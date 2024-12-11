import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { tns } from 'tiny-slider';
import { WelcomeComponent } from '../../components/home/welcome/welcome.component';
import { FeaturesComponent } from '../../components/home/features/features.component';
import { NewsUpdatesComponent } from '../../components/home/news-updates/news-updates.component';
import { ChallengesOfTheDayComponent } from '../../components/home/challenges-of-the-day/challenges-of-the-day.component';
import { UserService } from '../../core/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, WelcomeComponent, FeaturesComponent, NewsUpdatesComponent, TranslateModule, ChallengesOfTheDayComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  loggedIn: boolean = false;
  loading: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private UserService: UserService
  ) {}

  ngOnInit() {
    this.UserService.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loggedIn => {
        this.loggedIn = loggedIn;
      });
    this.UserService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  ngAfterViewInit(): void {
    tns({
      container: '.tns-slider',
      autoplay: true,
      loop: true,
      swipeAngle: false,
      lazyload: true,
      responsive: {
        360: {
          items: 1,
          controls: true,
          edgePadding: 0
        },
        640: {
          items: 1
        },
        991: {
          items: 2,
          edgePadding: 0 
        },
        1200: {
          items: 3,
          edgePadding: 0
        }
      },
      autoplayTimeout: 3000,
      autoplayButtonOutput: false,
      autoplayHoverPause: true,
      mouseDrag: true,
      gutter: 0,
      nav: false,
      navPosition: 'bottom',
      controls: true,
      controlsContainer: "#customize-controls",
      items: 1,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
