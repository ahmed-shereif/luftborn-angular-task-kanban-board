import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { errorInterceptor, retryInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNoopAnimations(),
    provideNativeDateAdapter(),
    // errorInterceptor stays outermost so it only toasts once, after retryInterceptor exhausts retries.
    provideHttpClient(withInterceptors([errorInterceptor, retryInterceptor])),
    provideCharts(withDefaultRegisterables()),
  ],
};
