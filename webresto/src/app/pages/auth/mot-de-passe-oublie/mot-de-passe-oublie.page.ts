import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/** Vérifie que les deux champs mot de passe sont identiques */
function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const mdp  = ctrl.get('nouveauMdp')?.value;
  const conf = ctrl.get('confirmMdp')?.value;
  return mdp && conf && mdp !== conf ? { mismatch: true } : null;
}

/** Étapes du formulaire */
type Etape = 'email' | 'code' | 'succes';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatStepperModule
  ],
  templateUrl: './mot-de-passe-oublie.page.html',
  styleUrl: './mot-de-passe-oublie.page.scss'
})
export class MotDePasseOubliePage {

  /** Étape courante du formulaire */
  etape: Etape = 'email';

  /** Email saisi à l'étape 1, conservé pour l'étape 2 */
  emailSaisi = '';

  /**
   * Code généré par la simulation.
   * Affiché à l'écran au Jalon I.
   * Au Jalon II : envoyé par email, jamais affiché ici.
   */
  codeSimule = '';

  chargement  = false;
  erreur      = '';
  afficherMdp = false;
  afficherConf = false;

  /* ── Formulaire étape 1 : email ── */
  formeEmail = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /* ── Formulaire étape 2 : code + nouveau mot de passe ── */
  formeCode = this.fb.group({
    code:       ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    nouveauMdp: ['', [Validators.required, Validators.minLength(6)]],
    confirmMdp: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private toast:  ToastService,
    private router: Router
  ) {}

  /* ── Étape 1 : demander le code ──────────────────────── */
  demanderCode(): void {
    if (this.formeEmail.invalid) { this.formeEmail.markAllAsTouched(); return; }
    this.chargement = true;
    this.erreur = '';
    this.emailSaisi = this.formeEmail.value.email!;

    this.auth.demanderReinitialisationMdp(this.emailSaisi).subscribe({
      next: code => {
        this.codeSimule = code;
        this.chargement = false;
        this.etape = 'code';
      },
      error: (err: Error) => {
        this.chargement = false;
        this.erreur = err.message;
      }
    });
  }

  /* ── Étape 2 : valider le code et changer le mot de passe ── */
  reinitialiser(): void {
    if (this.formeCode.invalid) { this.formeCode.markAllAsTouched(); return; }

    const codeSaisi = this.formeCode.value.code!;

    // Vérification du code (simulation Jalon I)
    if (codeSaisi !== this.codeSimule) {
      this.formeCode.get('code')!.setErrors({ codeInvalide: true });
      return;
    }

    this.chargement = true;
    this.erreur = '';

    this.auth.reinitialiserMdp(this.emailSaisi, this.formeCode.value.nouveauMdp!).subscribe({
      next: () => {
        this.chargement = false;
        this.etape = 'succes';
        this.toast.show('✅ Mot de passe modifié avec succès !');
      },
      error: (err: Error) => {
        this.chargement = false;
        this.erreur = err.message;
      }
    });
  }

  /* ── Retour à l'étape 1 ── */
  recommencer(): void {
    this.etape = 'email';
    this.erreur = '';
    this.codeSimule = '';
    this.emailSaisi = '';
    this.formeEmail.reset();
    this.formeCode.reset();
  }

  /* ── Getters pour la jauge de force ── */
  get forcePct(): number {
    const pwd = this.formeCode.get('nouveauMdp')?.value ?? '';
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
