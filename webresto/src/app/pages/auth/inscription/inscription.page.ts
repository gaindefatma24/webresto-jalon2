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
  selector: 'app-inscription',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatIconModule
  ],
  templateUrl: './inscription.page.html',
  styleUrl: './inscription.page.scss'
})
export class InscriptionPage {

  formulaire = this.fb.group({
    nom:        ['', Validators.required],
    prenom:     ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    telephone:  [''],
    adresse:    [''],
    role:       [Role.CLIENT, Validators.required]
  });

  chargement  = false;
  erreur      = '';
  afficherMdp = false;

  constructor(
    private fb:    FormBuilder,
    private auth:  AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  soumettre(): void {
    if (this.formulaire.invalid) { this.formulaire.markAllAsTouched(); return; }
    this.chargement = true;
    this.erreur = '';
    const v = this.formulaire.value;
    this.auth.register({
      nom:       v.nom!,
      prenom:    v.prenom!,
      email:     v.email!,
      password:  v.motDePasse!,
      telephone: v.telephone ?? '',
      adresse:   v.adresse ?? '',
      role:      v.role as Role
    }).subscribe({
      next: () => {
        this.chargement = false;
        this.toast.show('✅ Compte créé !');
        this.router.navigate(['/restaurants']);
      },
      error: (err: Error) => { this.chargement = false; this.erreur = err.message; }
    });
  }
}
