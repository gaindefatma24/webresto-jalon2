import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { StatutCommande } from '../../core/models';

@Component({
  selector: 'app-statut-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './statut-badge.component.html',
  styleUrl: './statut-badge.component.scss'
})
export class StatutBadgeComponent {
  @Input({ required: true }) statut!: StatutCommande;

  get label(): string {
    const m: Record<StatutCommande, string> = {
      EN_ATTENTE:     '⏳ En attente',
      EN_PREPARATION: '👨‍🍳 En préparation',
      EN_LIVRAISON:   '🚗 En livraison',
      LIVREE:         '✅ Livrée',
      ANNULEE:        '❌ Annulée'
    };
    return m[this.statut];
  }

  get cssClass(): string {
    const m: Record<StatutCommande, string> = {
      EN_ATTENTE:     'statut-attente',
      EN_PREPARATION: 'statut-preparation',
      EN_LIVRAISON:   'statut-livraison',
      LIVREE:         'statut-livree',
      ANNULEE:        'statut-annulee'
    };
    return m[this.statut];
  }
}
