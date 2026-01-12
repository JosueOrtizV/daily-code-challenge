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

    getCsrfToken(): Observable<any> {
        return this.http.get(`${environment.apiUrlCsrf}/sanctum/csrf-cookie`, { withCredentials: true }).pipe(
            tap(() => {
            }),
            catchError((error) => {
                console.error('Error al obtener la CSRF cookie:', error);
                throw error;
            })
        );
    }
}
