import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-wrapper">

      <!-- MatCard remplace le div.auth-card custom -->
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Connexion</mat-card-title>
          <mat-card-subtitle>Connectez-vous à votre compte</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">

            <!-- Email — MatFormField + MatInput -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"
                     placeholder="votre@email.com">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email requis</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
            </mat-form-field>

            <!-- Mot de passe -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput [type]="showPwd ? 'text' : 'password'"
                     formControlName="password" placeholder="••••••">
              <button mat-icon-button matSuffix type="button"
                      (click)="showPwd = !showPwd">
                <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Mot de passe requis</mat-error>
            </mat-form-field>

            <!-- Message d'erreur global -->
            <div class="error-banner" *ngIf="errorMsg">
              <mat-icon>error_outline</mat-icon> {{ errorMsg }}
            </div>

            <!-- Bouton connexion -->
            <button mat-flat-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Se connecter</span>
            </button>
          </form>

          <!-- Hint pré-remplissage -->
          <div class="hint-box" *ngIf="hintRole">
            ✅ Formulaire pré-rempli — cliquez sur <strong>Se connecter</strong>
          </div>

          <mat-divider class="divider"></mat-divider>

          <!-- Comptes de démonstration -->
          <div class="demo-section">
            <p class="demo-title">Comptes de test</p>
            <div class="demo-btns">
              <button mat-stroked-button (click)="quickLogin('client')">👤 Client</button>
              <button mat-stroked-button (click)="quickLogin('restaurateur')">🍽️ Restaurateur</button>
              <button mat-stroked-button (click)="quickLogin('livreur')">🚗 Livreur</button>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <p class="switch-link">
            Pas de compte ?
            <a mat-button color="primary" routerLink="/register">Inscrivez-vous</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper { display:flex; justify-content:center; align-items:center; min-height:calc(100vh - 62px); padding:2rem; }
    .auth-card { width:100%; max-width:440px; background:var(--bg-card) !important; border:1px solid var(--border) !important; }
    mat-card-title { font-family:var(--font-display) !important; font-size:1.7rem !important; color:var(--text-primary) !important; }
    mat-card-subtitle { color:var(--text-muted) !important; margin-bottom:1.5rem !important; }
    mat-card-header { padding:1.5rem 1.5rem 0 !important; }
    mat-card-content { padding:1rem 1.5rem !important; }
    mat-card-actions { padding:.5rem 1.5rem 1.5rem !important; }
    .full-width { width:100%; margin-bottom:.5rem; }
    .submit-btn { height:48px; font-size:1rem !important; margin-top:.5rem; display:flex; align-items:center; justify-content:center; gap:.5rem; }
    .error-banner { display:flex; align-items:center; gap:.5rem; background:var(--danger-bg); color:var(--danger); padding:.75rem 1rem; border-radius:var(--radius-sm); margin-bottom:.75rem; font-size:.88rem; }
    .hint-box { background:var(--success-bg); color:var(--success); padding:.6rem 1rem; border-radius:var(--radius-sm); font-size:.84rem; margin-top:.75rem; }
    .divider { margin:1.25rem 0 !important; }
    .demo-section { text-align:center; }
    .demo-title { color:var(--text-muted); font-size:.82rem; margin-bottom:.65rem; }
    .demo-btns { display:flex; gap:.5rem; justify-content:center; flex-wrap:wrap; }
    .demo-btns button { color:var(--text-secondary) !important; border-color:var(--border) !important; font-size:.82rem !important; }
    .switch-link { color:var(--text-muted); font-size:.88rem; text-align:center; width:100%; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  loading  = false;
  errorMsg = '';
  showPwd  = false;
  hintRole: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: user => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? null;
        if (returnUrl) { this.router.navigateByUrl(returnUrl); return; }
        if (user.role === Role.RESTAURATEUR) this.router.navigate(['/dashboard/restaurateur']);
        else if (user.role === Role.LIVREUR)  this.router.navigate(['/dashboard/livreur']);
        else                                   this.router.navigate(['/restaurants']);
      },
      error: (err: Error) => { this.loading = false; this.errorMsg = err.message; }
    });
  }

  quickLogin(role: 'client' | 'restaurateur' | 'livreur'): void {
    const creds: Record<string, { email: string; password: string }> = {
      client:       { email: 'client@test.com',  password: '123456' },
      restaurateur: { email: 'resto@test.com',    password: '123456' },
      livreur:      { email: 'livreur@test.com',  password: '123456' }
    };
    this.form.patchValue(creds[role]);
    this.hintRole = role;
    this.errorMsg = '';
    this.submit();
  }
}
