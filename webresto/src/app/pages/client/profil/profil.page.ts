/**
 * ProfilPage — Jalon II
 *
 * CHANGEMENTS vs Jalon I :
 *   - Suppression de StorageService (plus de données mock)
 *   - sauvegarderInfos() appelle auth.updateProfile() → PUT /api/auth/profile
 *   - sauvegarderMdp() n'est plus possible ici sans l'ancien mot de passe
 *     vérifié côté serveur → fonctionnalité déplacée vers reset-password
 *     (le serveur ne renvoie jamais le mot de passe haché)
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatTabsModule, MatChipsModule, MatProgressSpinnerModule
  ],
  templateUrl: './profil.page.html',
  styleUrl: './profil.page.scss'
})
export class ProfilPage implements OnInit {

  utilisateur: User | null = null;
  chargement  = false;
  erreur      = '';

  infoForm = this.fb.group({
    prenom:    ['', Validators.required],
    nom:       ['', Validators.required],
    email:     [{ value: '', disabled: true }],  // email non modifiable
    telephone: [''],
    adresse:   ['']
  });

  constructor(
      private fb:    FormBuilder,
      public  auth:  AuthService,
      private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.utilisateur = this.auth.currentUser;
    if (this.utilisateur) this._remplir(this.utilisateur);
  }

  private _remplir(u: User): void {
    this.infoForm.patchValue({
      prenom: u.prenom, nom: u.nom, email: u.email,
      telephone: u.telephone || '', adresse: u.adresse || ''
    });
    this.infoForm.markAsPristine();
  }

  /** PUT /api/auth/profile via AuthService */
  sauvegarderInfos(): void {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    this.chargement = true;
    this.erreur     = '';

    const v = this.infoForm.getRawValue();
    this.auth.updateProfile({
      nom:       v.nom!,
      prenom:    v.prenom!,
      telephone: v.telephone || '',
      adresse:   v.adresse || ''
    }).subscribe({
      next: user => {
        this.chargement  = false;
        this.utilisateur = user;
        this.infoForm.markAsPristine();
        this.toast.show('✅ Profil mis à jour');
      },
      error: (err: Error) => {
        this.chargement = false;
        this.erreur = err.message;
      }
    });
  }

  annulerInfos(): void {
    if (this.utilisateur) this._remplir(this.utilisateur);
  }

  get initiales(): string {
    if (!this.utilisateur) return '?';
    return (this.utilisateur.prenom[0] + (this.utilisateur.nom[0] ?? '')).toUpperCase();
  }

  get roleLabel(): string {
    const m: Record<string, string> = {
      CLIENT: '👤 Client',
      RESTAURATEUR: '🍽️ Restaurateur',
      LIVREUR: '🚗 Livreur'
    };
    return m[this.utilisateur?.role ?? ''] ?? '';
  }
}
