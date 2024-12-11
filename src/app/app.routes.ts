import { Routes } from '@angular/router';
import { ProgressComponent } from './components/profile/progress/progress.component';
import { ProfileSettingsComponent } from './components/profile/profile-settings/profile-settings.component';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
    { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
    { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
    { path: 'daily-challenge', loadComponent: () => import('./pages/daily-code-challenge/daily-code-challenge.component').then(m => m.DailyCodeChallengeComponent) },
    { path: 'more-challenges', loadComponent: () => import('./pages/more-challenges/more-challenges.component').then(m => m.MoreChallengesComponent) },
    { path: 'ranking', loadComponent: () => import('./pages/ranking/ranking.component').then(m => m.RankingComponent) },
    { path: 'faq-support', loadComponent: () => import('./pages/faq-support/faq-support.component').then(m => m.FaqSupportComponent) },
    { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), 
        children: [
            { path: 'progress', component: ProgressComponent },
            { path: 'profile-settings', component: ProfileSettingsComponent },
            { path: '', redirectTo: '/profile/progress', pathMatch: 'full' },
        ],
        canActivate: [AuthGuard]
    },
    { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent), canActivate: [NoAuthGuard] },
    { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
    { path: 'donate', loadComponent: () => import('./pages/donate/donate.component').then(m => m.DonateComponent) },
    { path: 'privacy-policy', loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
    { path: 'terms-&-conditions', loadComponent: () => import('./pages/term-conditions/term-conditions.component').then(m => m.TermConditionsComponent) },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
