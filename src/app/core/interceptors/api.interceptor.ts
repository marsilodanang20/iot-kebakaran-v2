import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * HTTP Interceptor that adds API key header to all requests
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
    // Only add API key for requests to our API
    if (req.url.startsWith(environment.apiUrl)) {
        const clonedRequest = req.clone({
            setHeaders: {
                'X-API-KEY': environment.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return next(clonedRequest);
    }
    return next(req);
};
