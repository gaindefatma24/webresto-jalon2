import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';
import { StorageService, STORAGE_KEYS } from '../../core/services/storage.service';
import { ToastService } from '../../core/services/toast.service';
import { User, Role } from '../../core/models';

/** Vérifie que les deux champs de mot de passe sont identiques */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pwd  = control.get('newPassword')?.value;
  const conf = control.get('confirmPassword')?.value;
  return pwd && conf && pwd !== conf ? { mismatch: true } : null;
}

/** Validateur code postal canadien */
function postalCodeValidator(control: AbstractControl): ValidationErrors | null {
  const val = (control.value || '').toUpperCase().trim();
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(val) ? null : { postalCode: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatTabsModule, MatChipsModule
  ],
  template: `
    <div class="page">
      <div class="container-mid">

        <!-- En-tête profil -->
        <div class="profile-header">
          <div class="avatar-circle">{{ initiales }}</div>
          <div>
            <h1 class="page-title">{{ user?.prenom }} {{ user?.nom }}</h1>
            <p class="page-subtitle">{{ user?.email }}</p>
            <mat-chip-set>
              <mat-chip class="role-chip">{{ roleLabel }}</mat-chip>
            </mat-chip-set>
          </div>
        </div>

        <!-- Onglets MatTab -->
        <mat-tab-group animationDuration="200ms" color="accent">

          <!-- ── Onglet 1 : Informations personnelles ── -->
          <mat-tab label="👤 Informations">
            <div class="tab-content">
              <form [formGroup]="infoForm" (ngSubmit)="saveInfos()">

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Prénom</mat-label>
                    <input matInput formControlName="prenom">
                    <mat-error *ngIf="infoForm.get('prenom')?.hasError('required')">Requis</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nom</mat-label>
                    <input matInput formControlName="nom">
                    <mat-error *ngIf="infoForm.get('nom')?.hasError('required')">Requis</mat-error>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email">
                  <mat-icon matSuffix>email</mat-icon>
                  <mat-error *ngIf="infoForm.get('email')?.hasError('required')">Requis</mat-error>
                  <mat-error *ngIf="infoForm.get('email')?.hasError('email')">Email invalide</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Téléphone</mat-label>
                  <input matInput type="tel" formControlName="telephone" placeholder="514-555-0000">
                  <mat-icon matSuffix>phone</mat-icon>
                </mat-form-field>

                <mat-divider class="divider"></mat-divider>
                <p class="section-label">📍 Adresse de livraison</p>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Numéro et rue</mat-label>
                  <input matInput formControlName="adresseRue" placeholder="100 Rue Sainte-Catherine O">
                  <mat-icon matSuffix>signpost</mat-icon>
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Ville</mat-label>
                    <input matInput formControlName="ville" placeholder="Montréal">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Code postal</mat-label>
                    <input matInput formControlName="codePostal" placeholder="H3A 1B5"
                           maxlength="7" (input)="formatPostal($event)">
                    <mat-error *ngIf="infoForm.get('codePostal')?.hasError('postalCode')">
                      Format invalide (ex: H3A 1B5)
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Province</mat-label>
                    <input matInput formControlName="province" placeholder="QC">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Pays</mat-label>
                    <input matInput formControlName="pays" readonly>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-flat-button color="primary" type="submit"
                          [disabled]="infoForm.pristine || infoForm.invalid">
                    <mat-icon>save</mat-icon> Sauvegarder
                  </button>
                  <button mat-stroked-button type="button" (click)="resetInfos()">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </mat-tab>

          <!-- ── Onglet 2 : Sécurité / Mot de passe ── -->
          <mat-tab label="🔒 Sécurité">
            <div class="tab-content">
              <form [formGroup]="pwdForm" (ngSubmit)="savePassword()">

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Mot de passe actuel</mat-label>
                  <input matInput [type]="showCurrent ? 'text' : 'password'"
                         formControlName="currentPassword">
                  <button mat-icon-button matSuffix type="button"
                          (click)="showCurrent = !showCurrent">
                    <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="pwdForm.get('currentPassword')?.hasError('required')">
                    Requis
                  </mat-error>
                  <mat-error *ngIf="pwdForm.get('currentPassword')?.hasError('wrongPassword')">
                    Mot de passe incorrect
                  </mat-error>
                </mat-form-field>

                <mat-divider class="divider"></mat-divider>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nouveau mot de passe</mat-label>
                  <input matInput [type]="showNew ? 'text' : 'password'"
                         formControlName="newPassword">
                  <button mat-icon-button matSuffix type="button"
                          (click)="showNew = !showNew">
                    <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-hint>6 caractères minimum</mat-hint>
                  <mat-error *ngIf="pwdForm.get('newPassword')?.hasError('required')">Requis</mat-error>
                  <mat-error *ngIf="pwdForm.get('newPassword')?.hasError('minlength')">
                    6 caractères minimum
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Confirmer le nouveau mot de passe</mat-label>
                  <input matInput [type]="showConfirm ? 'text' : 'password'"
                         formControlName="confirmPassword">
                  <button mat-icon-button matSuffix type="button"
                          (click)="showConfirm = !showConfirm">
                    <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="pwdForm.hasError('mismatch')">
                    Les mots de passe ne correspondent pas
                  </mat-error>
                </mat-form-field>

                <!-- Indicateur de force du mot de passe -->
                <div class="strength-bar" *ngIf="pwdForm.get('newPassword')?.value">
                  <div class="strength-label">Force : <strong>{{ strengthLabel }}</strong></div>
                  <div class="strength-track">
                    <div class="strength-fill" [style.width.%]="strengthPct"
                         [style.background]="strengthColor"></div>
                  </div>
                </div>

                <div class="form-actions">
                  <button mat-flat-button color="primary" type="submit"
                          [disabled]="pwdForm.invalid">
                    <mat-icon>lock_reset</mat-icon> Changer le mot de passe
                  </button>
                  <button mat-stroked-button type="button" (click)="pwdForm.reset()">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .container-mid { max-width:680px; margin:0 auto; padding:2rem 1.5rem; }

    /* ── En-tête ── */
    .profile-header {
      display:flex; align-items:center; gap:1.5rem;
      margin-bottom:2rem; flex-wrap:wrap;
    }
    .avatar-circle {
      width:72px; height:72px; border-radius:50%;
      background:var(--accent); color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; font-weight:700;
      font-family:var(--font-display); flex-shrink:0;
    }
    .page-title { font-family:var(--font-display); font-size:1.6rem; margin:0 0 .2rem; }
    .page-subtitle { color:var(--text-muted); font-size:.9rem; margin:0 0 .5rem; }
    .role-chip { background:var(--accent-soft) !important; color:var(--accent) !important; }

    /* ── Onglets ── */
    ::ng-deep .mat-mdc-tab-header { border-bottom:1px solid var(--border); }
    .tab-content { padding:1.5rem 0; }

    /* ── Formulaire ── */
    .full-width { width:100%; }
    .form-row { display:flex; gap:.75rem; flex-wrap:wrap; mat-form-field { flex:1; min-width:180px; } }
    .section-label { font-size:.82rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em; margin:.5rem 0 .75rem; }
    .divider { margin:1.25rem 0 !important; }
    .form-actions { display:flex; gap:.75rem; margin-top:1.25rem; flex-wrap:wrap; }

    /* ── Jauge de force du mot de passe ── */
    .strength-bar { margin:.5rem 0 1rem; }
    .strength-label { font-size:.82rem; color:var(--text-muted); margin-bottom:.3rem; strong { color:var(--text-primary); } }
    .strength-track { height:6px; background:var(--border); border-radius:3px; overflow:hidden; }
    .strength-fill { height:100%; border-radius:3px; transition:width .4s, background .4s; }
  `]
})
export class ProfileComponent implements OnInit {

  user: User | null = null;
  showCurrent = false;
  showNew     = false;
  showConfirm = false;

  /** Formulaire informations personnelles */
  infoForm = this.fb.group({
    prenom:    ['', Validators.required],
    nom:       ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    telephone: [''],
    adresseRue:[''],
    ville:     [''],
    codePostal:['', postalCodeValidator],
    province:  [''],
    pays:      [{ value: 'Canada', disabled: true }]
  });

  /** Formulaire mot de passe avec validateur de correspondance */
  pwdForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  constructor(
    private fb:      FormBuilder,
    public  auth:    AuthService,
    private storage: StorageService,
    private toast:   ToastService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    if (this.user) this.populateInfoForm(this.user);
  }

  /** Pré-remplit le formulaire infos avec les données de l'utilisateur connecté */
  private populateInfoForm(u: User): void {
    const parts = (u.adresse || '').split(',').map(s => s.trim());
    this.infoForm.patchValue({
      prenom:     u.prenom,
      nom:        u.nom,
      email:      u.email,
      telephone:  u.telephone || '',
      adresseRue: parts[0] || '',
      ville:      parts[1] || '',
      codePostal: parts[2] || '',
      province:   parts[3] || 'QC',
    });
    this.infoForm.markAsPristine();
  }

  /** Met à jour les informations personnelles en mémoire */
  saveInfos(): void {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    const v = this.infoForm.getRawValue();

    // Reconstruit l'adresse complète
    const adresse = [v.adresseRue, v.ville, v.codePostal?.toUpperCase(), v.province, v.pays]
      .filter(Boolean).join(', ');

    // Met à jour dans le tableau users en mémoire
    const users: User[] = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === this.user!.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], prenom: v.prenom!, nom: v.nom!, email: v.email!, telephone: v.telephone || '', adresse };
      this.storage.saveAll(STORAGE_KEYS.USERS, users);
      // Met à jour la session courante
      const updated = users[idx];
      this.auth.updateCurrentUser(updated);
      this.user = updated;
    }
    this.infoForm.markAsPristine();
    this.toast.show('✅ Informations mises à jour');
  }

  resetInfos(): void {
    if (this.user) this.populateInfoForm(this.user);
  }

  /** Sauvegarde le nouveau mot de passe */
  savePassword(): void {
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    const { currentPassword, newPassword } = this.pwdForm.value;

    // Vérifie le mot de passe actuel
    const users: User[] = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === this.user!.id);
    if (idx === -1 || users[idx].password !== currentPassword) {
      this.pwdForm.get('currentPassword')!.setErrors({ wrongPassword: true });
      return;
    }

    // Enregistre le nouveau mot de passe
    users[idx] = { ...users[idx], password: newPassword! };
    this.storage.saveAll(STORAGE_KEYS.USERS, users);
    this.pwdForm.reset();
    this.toast.show('🔒 Mot de passe modifié avec succès');
  }

  /** Formate le code postal en A1A 1A1 à la frappe */
  formatPostal(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3) + ' ' + val.slice(3, 6);
    input.value = val;
    this.infoForm.get('codePostal')!.setValue(val, { emitEvent: false });
  }

  /** Initiales pour l'avatar */
  get initiales(): string {
    if (!this.user) return '?';
    return (this.user.prenom[0] + (this.user.nom[0] ?? '')).toUpperCase();
  }

  get roleLabel(): string {
    const m: Record<string, string> = { CLIENT: '👤 Client', RESTAURATEUR: '🍽️ Restaurateur', LIVREUR: '🚗 Livreur' };
    return m[this.user?.role ?? ''] ?? '';
  }

  /** Calcule la force du mot de passe (0–100) */
  get strengthPct(): number {
    const pwd = this.pwdForm.get('newPassword')?.value ?? '';
    let score = 0;
    if (pwd.length >= 6)  score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    return score;
  }

  get strengthLabel(): string {
    const p = this.strengthPct;
    if (p <= 25) return 'Faible';
    if (p <= 50) return 'Moyen';
    if (p <= 75) return 'Bon';
    return 'Excellent';
  }

  get strengthColor(): string {
    const p = this.strengthPct;
    if (p <= 25) return '#ef4444';
    if (p <= 50) return '#eab308';
    if (p <= 75) return '#3b82f6';
    return '#22c55e';
  }
}
