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
import { AuthService } from '../../../core/services/auth.service';
import { StorageService, STORAGE_KEYS } from '../../../core/services/storage.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pwd  = ctrl.get('newPassword')?.value;
  const conf = ctrl.get('confirmPassword')?.value;
  return pwd && conf && pwd !== conf ? { mismatch: true } : null;
}

function postalCodeValidator(ctrl: AbstractControl): ValidationErrors | null {
  const val = (ctrl.value || '').toUpperCase().trim();
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(val) ? null : { postalCode: true };
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatTabsModule, MatChipsModule
  ],
  templateUrl: './profil.page.html',
  styleUrl: './profil.page.scss'
})
export class ProfilPage implements OnInit {

  utilisateur: User | null = null;
  afficherActuel  = false;
  afficherNouv    = false;
  afficherConfirm = false;

  infoForm = this.fb.group({
    prenom:     ['', Validators.required],
    nom:        ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    telephone:  [''],
    rue:        [''],
    ville:      [''],
    codePostal: ['', postalCodeValidator],
    province:   [''],
    pays:       [{ value: 'Canada', disabled: true }]
  });

  mdpForm = this.fb.group({
    motDePasseActuel: ['', Validators.required],
    newPassword:      ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword:  ['', Validators.required]
  }, { validators: passwordMatchValidator });

  constructor(
    private fb:      FormBuilder,
    public  auth:    AuthService,
    private storage: StorageService,
    private toast:   ToastService
  ) {}

  ngOnInit(): void {
    this.utilisateur = this.auth.currentUser;
    if (this.utilisateur) this.remplirFormulaire(this.utilisateur);
  }

  private remplirFormulaire(u: User): void {
    const parts = (u.adresse || '').split(',').map(s => s.trim());
    this.infoForm.patchValue({
      prenom: u.prenom, nom: u.nom, email: u.email,
      telephone: u.telephone || '',
      rue: parts[0] || '', ville: parts[1] || '',
      codePostal: parts[2] || '', province: parts[3] || 'QC'
    });
    this.infoForm.markAsPristine();
  }

  sauvegarderInfos(): void {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    const v = this.infoForm.getRawValue();
    const adresse = [v.rue, v.ville, v.codePostal?.toUpperCase(), v.province, v.pays]
      .filter(Boolean).join(', ');
    const users: User[] = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === this.utilisateur!.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], prenom: v.prenom!, nom: v.nom!, email: v.email!, telephone: v.telephone || '', adresse };
      this.storage.saveAll(STORAGE_KEYS.USERS, users);
      this.auth.updateCurrentUser(users[idx]);
      this.utilisateur = users[idx];
    }
    this.infoForm.markAsPristine();
    this.toast.show('✅ Informations mises à jour');
  }

  annulerInfos(): void {
    if (this.utilisateur) this.remplirFormulaire(this.utilisateur);
  }

  sauvegarderMdp(): void {
    if (this.mdpForm.invalid) { this.mdpForm.markAllAsTouched(); return; }
    const { motDePasseActuel, newPassword } = this.mdpForm.value;
    const users: User[] = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === this.utilisateur!.id);
    if (idx === -1 || users[idx].password !== motDePasseActuel) {
      this.mdpForm.get('motDePasseActuel')!.setErrors({ wrongPassword: true });
      return;
    }
    users[idx] = { ...users[idx], password: newPassword! };
    this.storage.saveAll(STORAGE_KEYS.USERS, users);
    this.mdpForm.reset();
    this.toast.show('🔒 Mot de passe modifié');
  }

  formaterCodePostal(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3) + ' ' + val.slice(3, 6);
    input.value = val;
    this.infoForm.get('codePostal')!.setValue(val, { emitEvent: false });
  }

  get initiales(): string {
    if (!this.utilisateur) return '?';
    return (this.utilisateur.prenom[0] + (this.utilisateur.nom[0] ?? '')).toUpperCase();
  }

  get roleLabel(): string {
    const m: Record<string, string> = { CLIENT: '👤 Client', RESTAURATEUR: '🍽️ Restaurateur', LIVREUR: '🚗 Livreur' };
    return m[this.utilisateur?.role ?? ''] ?? '';
  }

  get forcePct(): number {
    const pwd = this.mdpForm.get('newPassword')?.value ?? '';
    let score = 0;
    if (pwd.length >= 6)           score += 25;
    if (pwd.length >= 10)          score += 25;
    if (/[A-Z]/.test(pwd))         score += 20;
    if (/[0-9]/.test(pwd))         score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    return score;
  }

  get forceLabel(): string {
    const p = this.forcePct;
    if (p <= 25) return 'Faible';
    if (p <= 50) return 'Moyen';
    if (p <= 75) return 'Bon';
    return 'Excellent';
  }

  get forceCouleur(): string {
    const p = this.forcePct;
    if (p <= 25) return '#ef4444';
    if (p <= 50) return '#eab308';
    if (p <= 75) return '#3b82f6';
    return '#22c55e';
  }
}
