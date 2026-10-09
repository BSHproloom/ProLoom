import { Component, inject, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-login-callback',
  standalone: true,
  template: `
    <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f8fafc; font-family: sans-serif;">
      <h2 style="color: #334155; margin-bottom: 8px;">Authenticating...</h2>
      <p style="color: #64748b;">Please wait while we complete your sign in.</p>
    </div>
  `
})
export class LoginCallbackComponent implements OnInit {
  private msalService = inject(MsalService);
  private router = inject(Router);

  ngOnInit() {
    this.msalService.initialize().subscribe({
      next: () => {
        this.msalService.handleRedirectObservable().subscribe({
          next: (result) => {
            // Login handled successfully, navigate back to home route
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Redirect error:', err);
            this.router.navigate(['/']);
          }
        });
      },
      error: () => this.router.navigate(['/'])
    });
  }
}
