import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    constructor(private translate: TranslateService) {
        const savedLanguage = localStorage.getItem('language') || 'en';
        this.translate.setDefaultLang(savedLanguage);
        this.translate.use(savedLanguage);
    }
    
    setLanguage(lang: string) {
        this.translate.use(lang);
        localStorage.setItem('language', lang);
    }
    
    getLanguage() {
        return this.translate.currentLang || localStorage.getItem('language') || 'en';
    }
}
