import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "../app/shared/components/header/header.component";
import { FooterComponent } from "../app/shared/components/footer/footer.component";
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from './core/services/user.service';
import { CsrfService } from './core/services/csrf.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MatProgressSpinnerModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  loading: boolean = true;
  loggedIn: boolean = false;

  constructor(private userService: UserService, private csrfService: CsrfService) {}

  ngOnInit(): void {
    this.userService.loading$.subscribe(loading => this.loading = loading);
    this.userService.loggedIn$.subscribe(loggedIn => this.loggedIn = loggedIn);

    // if (!this.loading && this.loading) {
    //   this.csrfService.getCsrfToken().toPromise();
    // }
  }
}
