/**
 * MotDePasseOubliePage — Jalon II
 *
 * CHANGEMENT vs Jalon I :
 *   Jalon I : le code à 6 chiffres était affiché à l'écran (simulation)
 *   Jalon II : un lien est envoyé par email. L'utilisateur clique sur le lien
 *              qui l'amène sur /reset-password?token=UUID
 *
 * Ce composant gère l'étape 1 uniquement : saisie de l'email.
 * L'étape 2 (nouveau mot de passe) est dans ResetPasswordPage.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

type Etape = 'email' | 'envoye';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule
  ],
  templateUrl: './mot-de-passe-oublie.page.html',
  styleUrl: './mot-de-passe-oublie.page.scss'
})
export class MotDePasseOubliePage {

  etape: Etape = 'email';
  chargement   = false;
  erreur       = '';
  emailSaisi   = '';

  formeEmail = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  /** Étape 1 : envoie la demande de reset au serveur */
  demanderReset(): void {
    if (this.formeEmail.invalid) { this.formeEmail.markAllAsTouched(); return; }
    this.chargement = true;
    this.erreur     = '';
    this.emailSaisi = this.formeEmail.value.email!;

    this.auth.demanderReinitialisationMdp(this.emailSaisi).subscribe({
      next: () => {
        this.chargement = false;
        this.etape = 'envoye'; // Affiche le message "vérifiez votre email"
      },
      error: (err: Error) => {
        this.chargement = false;
        // On affiche quand même "email envoyé" même si l'email n'existe pas
        // (sécurité : évite l'énumération d'emails)
        this.etape = 'envoye';
      }
    });
  }

  recommencer(): void {
    this.etape = 'email';
    this.erreur = '';
    this.formeEmail.reset();
  }
}
