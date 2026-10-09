import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { MsalModule, MsalService, MSAL_INSTANCE, MsalGuard, MsalInterceptor, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalGuardConfiguration, MsalInterceptorConfiguration, MsalBroadcastService } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType, LogLevel, BrowserCacheLocation } from '@azure/msal-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export const MSAL_CLIENT_ID = 'bd6f97e8-4c45-4bdb-85be-eb82bd744901';
export const MSAL_TENANT_ID = '3b660d71-4366-427c-a717-3cea16c64108';

export function msalInitializer(msalService: MsalService) {
  return () => {
    return new Promise<void>((resolve) => {
      msalService.initialize().subscribe({
        next: () => {
          msalService.handleRedirectObservable().subscribe({
            next: () => resolve(),
            error: () => resolve()
          });
        },
        error: () => resolve()
      });
    });
  };
}

export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: MSAL_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${MSAL_TENANT_ID}`,
      redirectUri: window.location.origin + '/auth.html',
      postLogoutRedirectUri: window.location.origin + '/auth.html'
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage
    },
    system: {
      popupBridgeTimeout: 300000,
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {},
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false
      }
    }
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/', ['User.Read', 'Files.ReadWrite.All', 'Sites.ReadWrite.All', 'Mail.Send']);

  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Popup,
    authRequest: {
      scopes: ['User.Read', 'Files.ReadWrite.All', 'Sites.ReadWrite.All', 'Mail.Send']
    }
  };
}

export function provideMicrosoftAuth() {
  return [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    {
      provide: APP_INITIALIZER,
      useFactory: msalInitializer,
      deps: [MsalService],
      multi: true
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ];
}
