import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommandeService } from '../../core/services/commande.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Commande, StatutCommande } from '../../core/models';

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatChipsModule,
    MatButtonModule, MatIconModule, MatDividerModule
  ],
  template: `
    <div class="page">
      <div class="container-mid">
        <h1 class="page-title">Mes Commandes</h1>

        <div class="empty-state" *ngIf="commandes.length === 0">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
          <p>Aucune commande pour le moment</p>
        </div>

        <!-- MatCard pour chaque commande -->
        <mat-card class="cmd-card" *ngFor="let cmd of commandes">
          <mat-card-header>
            <mat-card-title>Commande #{{ cmd.id }} — {{ cmd.restaurantNom }}</mat-card-title>
            <mat-card-subtitle>{{ cmd.date }}</mat-card-subtitle>
            <!-- MatChip pour le statut -->
            <mat-chip-set class="status-chips">
              <mat-chip [ngClass]="statusClass(cmd.statut)" [disabled]="true">
                {{ statusLabel(cmd.statut) }}
              </mat-chip>
            </mat-chip-set>
          </mat-card-header>

          <mat-card-content>
            <mat-divider></mat-divider>
            <div class="cmd-items">
              <div class="cmd-item-row" *ngFor="let l of cmd.lignes">
                <span>{{ l.quantite }}× {{ l.nomPlat }}</span>
                <span>{{ l.sousTotal | number:'1.2-2' }} $</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <div class="cmd-footer">
              <span class="cmd-addr">
                <mat-icon style="font-size:14px;vertical-align:middle">location_on</mat-icon>
                {{ cmd.adresseLivraison }}
              </span>
              <span class="cmd-total">{{ cmd.total | number:'1.2-2' }} $</span>
            </div>
            <div class="livreur-info" *ngIf="cmd.livreurNom">
              <mat-icon style="font-size:14px;vertical-align:middle">delivery_dining</mat-icon>
              Livreur : {{ cmd.livreurNom }}
            </div>
          </mat-card-content>

          <mat-card-actions *ngIf="cmd.statut === StatutCommande.EN_ATTENTE">
            <button mat-stroked-button color="warn" (click)="annuler(cmd)">
              <mat-icon>cancel</mat-icon> Annuler
            </button>
          </mat-card-actions>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .page-title { font-family:var(--font-display); font-size:1.8rem; margin-bottom:1.5rem; }
    .empty-state { text-align:center; padding:3rem; mat-icon { font-size:3rem; width:3rem; height:3rem; color:var(--text-muted); display:block; margin:0 auto .75rem; } p { color:var(--text-muted); } }
    .cmd-card { background:var(--bg-card) !important; border:1px solid var(--border) !important; margin-bottom:.85rem; }
    mat-card-header { position:relative; padding-bottom:.5rem !important; }
    mat-card-title { font-size:1rem !important; color:var(--text-primary) !important; }
    mat-card-subtitle { color:var(--text-muted) !important; font-size:.78rem !important; }
    .status-chips { position:absolute; top:1rem; right:1rem; }
    .cmd-items { padding:.75rem 0; }
    .cmd-item-row { display:flex; justify-content:space-between; padding:.2rem 0; font-size:.85rem; color:var(--text-secondary); }
    .cmd-footer { display:flex; justify-content:space-between; align-items:center; padding:.75rem 0; flex-wrap:wrap; gap:.5rem; }
    .cmd-addr { color:var(--text-muted); font-size:.82rem; }
    .cmd-total { font-weight:700; color:var(--accent); font-size:1.05rem; }
    .livreur-info { color:var(--text-muted); font-size:.82rem; padding-top:.5rem; }
    /* Couleurs des statuts via MatChip */
    .status-attente    { background:var(--warning-bg)  !important; color:var(--warning)  !important; }
    .status-preparation{ background:var(--info-bg)     !important; color:var(--info)     !important; }
    .status-livraison  { background:var(--purple-bg)   !important; color:var(--purple)   !important; }
    .status-livree     { background:var(--success-bg)  !important; color:var(--success)  !important; }
    .status-annulee    { background:var(--danger-bg)   !important; color:var(--danger)   !important; }
  `]
})
export class CommandesComponent implements OnInit {
  commandes: Commande[] = [];
  StatutCommande = StatutCommande;

  constructor(
    private commandeService: CommandeService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.commandeService.getMesCommandes(this.auth.currentUser!.id)
      .subscribe(c => this.commandes = c);
  }

  annuler(cmd: Commande): void {
    if (!confirm('Annuler cette commande ?')) return;
    this.commandeService.updateStatut(cmd.id, StatutCommande.ANNULEE).subscribe(() => {
      cmd.statut = StatutCommande.ANNULEE;
      this.toast.show('Commande annulée');
    });
  }

  statusLabel(s: StatutCommande): string {
    const m: Record<StatutCommande, string> = {
      EN_ATTENTE:'⏳ En attente', EN_PREPARATION:'👨‍🍳 En préparation',
      EN_LIVRAISON:'🚗 En livraison', LIVREE:'✅ Livrée', ANNULEE:'❌ Annulée'
    };
    return m[s];
  }

  statusClass(s: StatutCommande): string {
    const m: Record<StatutCommande, string> = {
      EN_ATTENTE:'status-attente', EN_PREPARATION:'status-preparation',
      EN_LIVRAISON:'status-livraison', LIVREE:'status-livree', ANNULEE:'status-annulee'
    };
    return m[s];
  }
}
