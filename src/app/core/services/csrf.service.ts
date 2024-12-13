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
        return this.http.get<{ csrfToken: string }>(`${environment.apiUrl}/csrf-token`, { withCredentials: true }).pipe(
            tap(response => {
                this.setCookie('XSRF-TOKEN', response.csrfToken);
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    private setCookie(name: string, value: string) {
        document.cookie = `${name}=${value};path=/;`;
    }
}
