import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CsrfService {
    constructor(private http: HttpClient) {}

    getCsrfToken(): Observable<{ csrfToken: string }> {
        console.log('getting csrftoken');
        return this.http.get<{ csrfToken: string }>(`${environment.apiUrl}/csrf-token`, { withCredentials: true }).pipe(
            tap(response => {
                console.log('csrf obtained', response.csrfToken);
                this.setCookie('XSRF-TOKEN', response.csrfToken);
            }),
            catchError((error) => {
                console.error('Error obtaining CSRF token:', error);
                throw error;
            })
        );
    }

    private setCookie(name: string, value: string) {
        document.cookie = `${name}=${value};path=/;`;
    }
}
