import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommandeCardComponent } from '../../../ui/commande-card/commande-card.component';
import { Commande, StatutCommande } from '../../../core/models';

interface CommandeUI extends Commande { _chargement?: boolean; }

@Component({
  selector: 'app-tableau-de-bord-livreur',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    MatBadgeModule, CommandeCardComponent
  ],
  templateUrl: './tableau-de-bord.page.html',
  styleUrl: './tableau-de-bord.page.scss'
})
export class TableauDeBordLivreurPage implements OnInit {

  disponibles:   CommandeUI[] = [];
  mesLivraisons: CommandeUI[] = [];
  StatutCommande = StatutCommande;

  get enCours(): CommandeUI[] { return this.mesLivraisons.filter(c => c.statut === StatutCommande.EN_LIVRAISON); }
  get livrees():  CommandeUI[] { return this.mesLivraisons.filter(c => c.statut === StatutCommande.LIVREE); }

  constructor(
    public  auth:   AuthService,
    private cmdSvc: CommandeService,
    private toast:  ToastService
  ) {}

  ngOnInit(): void { this.charger(); }

  private charger(): void {
    const id = this.auth.currentUser!.id;
    this.cmdSvc.getCommandesDisponibles().subscribe(c => this.disponibles  = c as CommandeUI[]);
    this.cmdSvc.getMesLivraisons(id).subscribe(c => this.mesLivraisons = c as CommandeUI[]);
  }

  prendreEnCharge(cmd: CommandeUI): void {
    const u = this.auth.currentUser!;

    // Recréer une nouvelle référence d'objet dans le tableau
    // → Angular détecte le changement malgré eventCoalescing
    this.disponibles = this.disponibles.map(c =>
      c.id === cmd.id ? { ...c, _chargement: true } : c
    );

    this.cmdSvc.prendreEnCharge(cmd.id, u.id, `${u.prenom} ${u.nom}`).subscribe({
      next: updated => {
        if (updated) {
          this.toast.show('🚗 Commande prise en charge !');
          this.charger();
        } else {
          this.disponibles = this.disponibles.map(c =>
            c.id === cmd.id ? { ...c, _chargement: false } : c
          );
        }
      },
      error: () => {
        this.disponibles = this.disponibles.map(c =>
          c.id === cmd.id ? { ...c, _chargement: false } : c
        );
      }
    });
  }

  confirmerLivraison(cmd: CommandeUI): void {

    // Recréer une nouvelle référence d'objet dans le tableau
    // → Angular détecte le changement malgré eventCoalescing
    this.mesLivraisons = this.mesLivraisons.map(c =>
      c.id === cmd.id ? { ...c, _chargement: true } : c
    );

    this.cmdSvc.confirmerLivraison(cmd.id).subscribe({
      next: () => {
        this.toast.show('✅ Livraison confirmée !');
        this.charger();
      },
      error: () => {
        this.mesLivraisons = this.mesLivraisons.map(c =>
          c.id === cmd.id ? { ...c, _chargement: false } : c
        );
      }
    });
  }
}
