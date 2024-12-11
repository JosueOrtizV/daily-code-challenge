import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const csrfToken = this.getCookie('XSRF-TOKEN');
        console.log('csrfToken in interceptor', csrfToken);

        if (csrfToken) {
            req = req.clone({
                headers: req.headers.set('X-XSRF-TOKEN', csrfToken),
                withCredentials: true
            });
        }
        return next.handle(req);
    }

    private getCookie(name: string): string | null {
        const matches = document.cookie.match(new RegExp(
            '(?:^|; )' + name.replace(/([.$?*|{}()[]\/+^])/g, '\\$1') + '=([^;]*)'
        ));
        return matches ? decodeURIComponent(matches[1]) : null;
    }
}
