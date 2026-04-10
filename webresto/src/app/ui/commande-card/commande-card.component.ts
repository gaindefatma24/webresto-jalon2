import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatutBadgeComponent } from '../statut-badge/statut-badge.component';
import { Commande, StatutCommande } from '../../core/models';

@Component({
  selector: 'app-commande-card',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    StatutBadgeComponent
  ],
  templateUrl: './commande-card.component.html',
  styleUrl: './commande-card.component.scss'
})
export class CommandeCardComponent {
  @Input({ required: true }) commande!: Commande;

  /** Affiche le nom du client (vue restaurateur / livreur) */
  @Input() afficherClient = false;

  /** Affiche les boutons Accepter / Refuser (vue restaurateur) */
  @Input() modeRestaurateur = false;

  /** Affiche les boutons Annuler (vue client) */
  @Input() modeClient = false;

  /** Affiche le bouton Confirmer livraison (vue livreur) */
  @Input() modeLivreur = false;

  /** État de chargement d'une action (spinner) */
  @Input() chargement = false;

  @Output() accepter          = new EventEmitter<Commande>();
  @Output() refuser           = new EventEmitter<Commande>();
  @Output() annuler           = new EventEmitter<Commande>();
  @Output() confirmerLivraison = new EventEmitter<Commande>();

  StatutCommande = StatutCommande;
}
