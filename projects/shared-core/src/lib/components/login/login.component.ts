import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BSH_LOGO_BASE64 } from './bsh-logo';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="login-wrapper">
      <div class="center-content">
        <h1 class="brand-title">Pro Loom</h1>
        
        <div class="login-card-modern">
          <!-- Top half (White) -->
          <div class="card-top-half">
            <div class="logo-area">
              <img [src]="bshLogo" alt="BSH" class="bsh-logo">
              <span class="divider">|</span>
              <span class="role-text">{{ role }} Login</span>
              <span class="divider">|</span>
              <span class="date-text">{{ currentDate | date:'dd MMM yyyy' }}</span>
            </div>
          </div>
          
          <!-- Bottom half (Transparent white glass) -->
          <div class="card-bottom-half">
            <div *ngIf="errorMsg" class="error-banner">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMsg }}</span>
            </div>
            
            <button class="ms-btn" (click)="onMicrosoftLogin()" [disabled]="isLoading">
              <svg class="ms-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span>{{ isLoading ? 'Signing in...' : 'Sign in with Microsoft' }}</span>
            </button>

            <p class="powered-by">Powered by Custom Carpet Department</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Inter:wght@400;500;600&display=swap');

    .login-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      /* Deeper base blue to make the bright and dark gradients pop more */
      background-color: #3266a3; 
      background-image: 
        radial-gradient(circle at 15% 85%, #7b62ff 0%, transparent 50%),
        radial-gradient(circle at 5% 5%, #1d234d 0%, transparent 55%),
        radial-gradient(circle at 90% 90%, #1a2b5e 0%, transparent 55%),
        radial-gradient(circle at 70% 30%, #509bf0 0%, transparent 65%);
      font-family: 'Inter', sans-serif;
      position: relative;
      overflow: hidden;
    }

    /* Fine static grain */
    .login-wrapper::after {
      content: "";
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.37;
      filter: grayscale(100%);
      pointer-events: none;
      z-index: 0;
    }

    .center-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding: 0 20px;
      gap: 32px;
    }

    .brand-title {
      font-family: 'Abril Fatface', serif;
      font-size: 64px;
      font-weight: 400;
      color: white;
      text-shadow: 0 4px 12px rgba(0,0,0,0.15);
      letter-spacing: 1px;
      margin: 0;
    }

    .login-card-modern {
      width: 100%;
      max-width: 520px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .card-top-half {
      background: white;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .bsh-logo {
      height: 32px;
      object-fit: contain;
    }
    
    .divider {
      color: #cbd5e1;
      font-weight: 300;
      font-size: 20px;
    }
    
    .role-text, .date-text {
      color: #334155;
      font-size: 16px;
      font-weight: 500;
    }
    
    .card-bottom-half {
      /* transparent white area (glassmorphism) - increased transparency */
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.4);
    }

    .ms-btn {
      width: auto;
      background: #ffffff;
      color: #5e5e5e;
      border: 1px solid #8c8c8c;
      border-radius: 4px;
      padding: 10px 20px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'Segoe UI', 'Inter', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: background 0.2s, box-shadow 0.2s;
    }
    
    .ms-btn:hover:not(:disabled) {
      background: #f3f2f1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .ms-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .ms-icon {
      width: 21px;
      height: 21px;
    }

    .powered-by {
      margin: 8px 0 0 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 500;
      width: 100%;
      text-align: center;
    }

    .error-banner {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffb4a9;
      font-size: 14px;
      background: rgba(255, 0, 0, 0.1);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
  `]
})
export class LoginComponent implements OnInit {
  @Input() role: string = 'User';
  @Input() errorMsg: string = '';
  @Output() loginSubmit = new EventEmitter<string>();
  @Output() microsoftLogin = new EventEmitter<string>();

  bshLogo = BSH_LOGO_BASE64;
  currentDate = new Date();
  isLoading = true;
  msalReady = false;

  private msalService = inject(MsalService);

  ngOnInit() {
    this.msalService.initialize().subscribe({
      next: () => {
        this.msalService.handleRedirectObservable().subscribe({
          next: () => {
            this.msalReady = true;
            this.isLoading = false;
            
            const accounts = this.msalService.instance.getAllAccounts();
            if (accounts.length > 0) {
              this.microsoftLogin.emit(accounts[0].username);
            }
          },
          error: (err) => {
            this.msalReady = true;
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }

  onMicrosoftLogin() {
    if (!this.msalReady) return;
    
    this.isLoading = true;
    
    this.msalService.loginRedirect({
      scopes: ['User.Read', 'Mail.Send', 'Files.ReadWrite.All', 'Sites.ReadWrite.All'],
      prompt: 'select_account'
    });
  }
}
