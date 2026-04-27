/**
 * ResetPasswordPage — Jalon II
 *
 * L'utilisateur arrive sur cette page via le lien reçu par email :
 *   http://localhost:4200/reset-password?token=UUID
 *
 * Ce composant :
 *   1. Lit le token depuis l'URL (?token=...)
 *   2. Affiche le formulaire de nouveau mot de passe
 *   3. Envoie POST /api/auth/reset-password { token, newPassword }
 *   4. Redirige vers la connexion si succès
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
    const pwd  = ctrl.get('nouveauMdp')?.value;
    const conf = ctrl.get('confirmMdp')?.value;
    return pwd && conf && pwd !== conf ? { mismatch: true } : null;
}

type Etape = 'formulaire' | 'succes' | 'erreur';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, RouterLink,
        MatCardModule, MatFormFieldModule, MatInputModule,
        MatButtonModule, MatIconModule
    ],
    templateUrl: `./reset-password.page.html`,
    styleUrls: ['./reset-password.page.scss']
})
export class ResetPasswordPage implements OnInit {

    token      = '';
    etape: Etape = 'formulaire';
    chargement = false;
    erreur     = '';
    showPwd    = false;
    showConf   = false;

    forme = this.fb.group({
        nouveauMdp: ['', [Validators.required, Validators.minLength(6)]],
        confirmMdp: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    constructor(
        private fb:     FormBuilder,
        private route:  ActivatedRoute,
        private router: Router,
        private auth:   AuthService,
        private toast:  ToastService
    ) {}

    ngOnInit(): void {
        // Lire le token depuis l'URL : /reset-password?token=UUID
        this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    }

    soumettre(): void {
        if (this.forme.invalid) { this.forme.markAllAsTouched(); return; }
        this.chargement = true;
        this.erreur     = '';

        this.auth.reinitialiserMdp(this.token, this.forme.value.nouveauMdp!).subscribe({
            next: () => {
                this.chargement = false;
                this.etape = 'succes';
                this.toast.show('🔒 Mot de passe modifié avec succès !');
            },
            error: (err: Error) => {
                this.chargement = false;
                this.erreur = err.message;
            }
        });
    }

    get forcePct(): number {
        const pwd = this.forme.get('nouveauMdp')?.value ?? '';
        let s = 0;
        if (pwd.length >= 6)            s += 25;
        if (pwd.length >= 10)           s += 25;
        if (/[A-Z]/.test(pwd))          s += 20;
        if (/[0-9]/.test(pwd))          s += 15;
        if (/[^A-Za-z0-9]/.test(pwd))  s += 15;
        return s;
    }
    get forceLabel(): string {
        const p = this.forcePct;
        if (p <= 25) return 'Faible'; if (p <= 50) return 'Moyen';
        if (p <= 75) return 'Bon';    return 'Excellent';
    }
    get forceCouleur(): string {
        const p = this.forcePct;
        if (p <= 25) return '#ef4444'; if (p <= 50) return '#eab308';
        if (p <= 75) return '#3b82f6'; return '#22c55e';
    }
}
