import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatIconModule
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Inscription</mat-card-title>
          <mat-card-subtitle>Créez votre compte WebResto</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="nom" placeholder="Tremblay">
                <mat-error *ngIf="form.get('nom')?.hasError('required')">Requis</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Prénom</mat-label>
                <input matInput formControlName="prenom" placeholder="Jean">
                <mat-error *ngIf="form.get('prenom')?.hasError('required')">Requis</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="votre@email.com">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email requis</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('emailTaken')">Email déjà utilisé</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput [type]="showPwd ? 'text' : 'password'"
                     formControlName="password" placeholder="6 caractères minimum">
              <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
                <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Requis</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">6 caractères minimum</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Téléphone</mat-label>
              <input matInput type="tel" formControlName="telephone" placeholder="514-555-0000">
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse</mat-label>
              <input matInput formControlName="adresse" placeholder="123 Rue Example, Montréal">
              <mat-icon matSuffix>location_on</mat-icon>
            </mat-form-field>

            <!-- MatSelect remplace le <select> natif -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rôle</mat-label>
              <mat-select formControlName="role">
                <mat-option value="CLIENT">👤 Client</mat-option>
                <mat-option value="RESTAURATEUR">🍽️ Restaurateur</mat-option>
                <mat-option value="LIVREUR">🚗 Livreur</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="error-banner" *ngIf="errorMsg">
              <mat-icon>error_outline</mat-icon> {{ errorMsg }}
            </div>

            <button mat-flat-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading">
              {{ loading ? 'Création...' : "S'inscrire" }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="switch-link">
            Déjà un compte ?
            <a mat-button color="primary" routerLink="/login">Connectez-vous</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper { display:flex; justify-content:center; align-items:center; min-height:calc(100vh - 62px); padding:2rem; }
    .auth-card { width:100%; max-width:480px; background:var(--bg-card) !important; border:1px solid var(--border) !important; }
    mat-card-title { font-family:var(--font-display) !important; font-size:1.7rem !important; color:var(--text-primary) !important; }
    mat-card-subtitle { color:var(--text-muted) !important; }
    mat-card-header { padding:1.5rem 1.5rem 0 !important; }
    mat-card-content { padding:1rem 1.5rem !important; }
    mat-card-actions { padding:.5rem 1.5rem 1.5rem !important; }
    .form-row { display:flex; gap:.75rem; mat-form-field { flex:1; } }
    .full-width { width:100%; }
    .submit-btn { height:48px; font-size:1rem !important; margin-top:.5rem; }
    .error-banner { display:flex; align-items:center; gap:.5rem; background:var(--danger-bg); color:var(--danger); padding:.75rem 1rem; border-radius:var(--radius-sm); margin-bottom:.75rem; font-size:.88rem; }
    .switch-link { color:var(--text-muted); font-size:.88rem; text-align:center; width:100%; }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    nom:       ['', Validators.required],
    prenom:    ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(6)]],
    telephone: [''],
    adresse:   [''],
    role:      [Role.CLIENT, Validators.required]
  });
  loading  = false;
  errorMsg = '';
  showPwd  = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    this.auth.register(this.form.value as any).subscribe({
      next: () => { this.loading = false; this.toast.show('✅ Compte créé !'); this.router.navigate(['/restaurants']); },
      error: (err: Error) => { this.loading = false; this.errorMsg = err.message; }
    });
  }
}
