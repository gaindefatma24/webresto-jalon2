import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './connexion.page.html',
  styleUrl: './connexion.page.scss'
})
export class ConnexionPage {

  formulaire = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required]
  });

  chargement  = false;
  erreur      = '';
  afficherMdp = false;
  roleDemo: string | null = null;

  constructor(
    private fb:    FormBuilder,
    private auth:  AuthService,
    private router: Router,
    private route:  ActivatedRoute
  ) {}

  soumettre(): void {
    if (this.formulaire.invalid) { this.formulaire.markAllAsTouched(); return; }
    this.chargement = true;
    this.erreur = '';
    const { email, motDePasse } = this.formulaire.value;
    this.auth.login(email!, motDePasse!).subscribe({
      next: user => {
        this.chargement = false;
        const retour = this.route.snapshot.queryParamMap.get('returnUrl');
        if (retour) { this.router.navigateByUrl(retour); return; }
        if (user.role === Role.RESTAURATEUR) this.router.navigate(['/dashboard/restaurateur']);
        else if (user.role === Role.LIVREUR)  this.router.navigate(['/dashboard/livreur']);
        else                                   this.router.navigate(['/restaurants']);
      },
      error: (err: Error) => { this.chargement = false; this.erreur = err.message; }
    });
  }

  connexionDemo(role: 'client' | 'restaurateur' | 'livreur'): void {
    const comptes: Record<string, { email: string; motDePasse: string }> = {
      client:       { email: 'client@test.com',  motDePasse: '123456' },
      restaurateur: { email: 'resto@test.com',    motDePasse: '123456' },
      livreur:      { email: 'livreur@test.com',  motDePasse: '123456' }
    };
    this.formulaire.patchValue(comptes[role]);
    this.roleDemo = role;
    this.erreur = '';
    this.soumettre();
  }
}
