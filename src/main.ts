import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, HttpClientModule, HttpClient } from '@angular/common/http'; 
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { importProvidersFrom } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar'; 
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    ...appConfig.providers,
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })),
    importProvidersFrom(MatToolbarModule),
    importProvidersFrom(MatIconModule),
    importProvidersFrom(MatButtonModule),
    importProvidersFrom(MatMenuModule)
  ]
}).catch(err => console.error(err));
