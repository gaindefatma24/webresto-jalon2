import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { CommandeService } from '../../core/services/commande.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Commande, StatutCommande } from '../../core/models';

interface CommandeUI extends Commande { _loading?: boolean; }

@Component({
  selector: 'app-dashboard-livreur',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatBadgeModule
  ],
  template: `
    <div class="page">
      <div class="container-mid">
        <h1 class="page-title">🚗 Dashboard Livreur</h1>
        <p class="page-subtitle">Bienvenue {{ auth.currentUser?.prenom }} {{ auth.currentUser?.nom }}</p>

        <!-- Statistiques — MatCard -->
        <div class="stats-row">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-number" [matBadge]="disponibles.length" matBadgeOverlap="false"
                   matBadgeColor="accent">{{ disponibles.length }}</div>
              <div class="stat-label">Disponibles</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-number">{{ enCours.length }}</div>
              <div class="stat-label">En cours</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-number">{{ livrees.length }}</div>
              <div class="stat-label">Livrées</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- COMMANDES DISPONIBLES -->
        <h2 class="section-title">📦 Commandes disponibles</h2>

        <div class="empty-state" *ngIf="disponibles.length === 0">
          <mat-icon>check_circle</mat-icon>
          <p>Aucune commande disponible</p>
        </div>

        <mat-card class="cmd-card" *ngFor="let cmd of disponibles">
          <mat-card-header>
            <mat-card-title>{{ cmd.restaurantNom }}</mat-card-title>
            <mat-card-subtitle>{{ cmd.date }}</mat-card-subtitle>
            <span class="cmd-total-badge">{{ cmd.total | number:'1.2-2' }} $</span>
          </mat-card-header>
          <mat-card-content>
            <div class="cmd-item-row" *ngFor="let l of cmd.lignes">
              <span>{{ l.quantite }}× {{ l.nomPlat }}</span>
            </div>
            <mat-divider style="margin:.5rem 0"></mat-divider>
            <p class="delivery-addr">
              <mat-icon style="font-size:14px;vertical-align:middle">location_on</mat-icon>
              {{ cmd.adresseLivraison }}
            </p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-flat-button color="primary" (click)="prendreEnCharge(cmd)"
                    [disabled]="cmd._loading">
              <mat-spinner *ngIf="cmd._loading" diameter="18"></mat-spinner>
              <mat-icon *ngIf="!cmd._loading">delivery_dining</mat-icon>
              {{ cmd._loading ? 'Traitement...' : 'Prendre en charge' }}
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- MES LIVRAISONS -->
        <h2 class="section-title" style="margin-top:2rem">🚗 Mes livraisons</h2>

        <div class="empty-state" *ngIf="mesLivraisons.length === 0">
          <mat-icon>local_shipping</mat-icon>
          <p>Aucune livraison en cours</p>
        </div>

        <mat-card class="cmd-card" *ngFor="let cmd of mesLivraisons">
          <mat-card-header>
            <mat-card-title>{{ cmd.restaurantNom }} → {{ cmd.clientNom }}</mat-card-title>
            <mat-card-subtitle>{{ cmd.date }}</mat-card-subtitle>
            <!-- MatChip pour le statut -->
            <mat-chip-set>
              <mat-chip [ngClass]="statusClass(cmd.statut)">{{ statusLabel(cmd.statut) }}</mat-chip>
            </mat-chip-set>
          </mat-card-header>
          <mat-card-content>
            <div class="cmd-item-row" *ngFor="let l of cmd.lignes">
              <span>{{ l.quantite }}× {{ l.nomPlat }}</span>
              <span>{{ l.sousTotal | number:'1.2-2' }} $</span>
            </div>
            <mat-divider style="margin:.5rem 0"></mat-divider>
            <div class="cmd-footer">
              <span class="delivery-addr">
                <mat-icon style="font-size:14px;vertical-align:middle">location_on</mat-icon>
                {{ cmd.adresseLivraison }}
              </span>
              <span class="cmd-total-text">{{ cmd.total | number:'1.2-2' }} $</span>
            </div>
          </mat-card-content>
          <mat-card-actions *ngIf="cmd.statut === StatutCommande.EN_LIVRAISON">
            <button mat-flat-button color="accent" (click)="confirmerLivraison(cmd)"
                    [disabled]="cmd._loading">
              <mat-spinner *ngIf="cmd._loading" diameter="18"></mat-spinner>
              <mat-icon *ngIf="!cmd._loading">check_circle</mat-icon>
              {{ cmd._loading ? 'Confirmation...' : 'Confirmer la livraison' }}
            </button>
          </mat-card-actions>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .page-title { font-family:var(--font-display); font-size:1.8rem; margin-bottom:.25rem; }
    .page-subtitle { color:var(--text-muted); margin-bottom:2rem; }
    .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:var(--bg-card) !important; border:1px solid var(--border) !important; text-align:center; }
    .stat-number { font-size:2rem; font-weight:700; color:var(--accent); font-family:var(--font-display); }
    .stat-label { color:var(--text-muted); font-size:.85rem; }
    .section-title { font-family:var(--font-display); font-size:1.15rem; color:var(--accent); margin-bottom:1rem; }
    .empty-state { text-align:center; padding:2rem; mat-icon { font-size:2.5rem; width:2.5rem; height:2.5rem; color:var(--text-muted); display:block; margin:0 auto .5rem; } p { color:var(--text-muted); } }
    .cmd-card { background:var(--bg-card) !important; border:1px solid var(--border) !important; margin-bottom:.85rem; }
    mat-card-title { font-size:1rem !important; color:var(--text-primary) !important; }
    mat-card-subtitle { color:var(--text-muted) !important; font-size:.78rem !important; }
    mat-card-header { position:relative; }
    .cmd-total-badge { position:absolute; right:1rem; top:1rem; color:var(--accent); font-weight:700; font-size:1rem; }
    .cmd-item-row { display:flex; justify-content:space-between; padding:.2rem 0; font-size:.85rem; color:var(--text-secondary); }
    .delivery-addr { color:var(--text-muted); font-size:.82rem; }
    .cmd-footer { display:flex; justify-content:space-between; align-items:center; }
    .cmd-total-text { font-weight:700; color:var(--accent); }
    .status-attente    { background:var(--warning-bg)  !important; color:var(--warning)  !important; }
    .status-preparation{ background:var(--info-bg)     !important; color:var(--info)     !important; }
    .status-livraison  { background:var(--purple-bg)   !important; color:var(--purple)   !important; }
    .status-livree     { background:var(--success-bg)  !important; color:var(--success)  !important; }
    .status-annulee    { background:var(--danger-bg)   !important; color:var(--danger)   !important; }
  `]
})
export class DashboardLivreurComponent implements OnInit {
  disponibles:   CommandeUI[] = [];
  mesLivraisons: CommandeUI[] = [];
  StatutCommande = StatutCommande;

  get enCours(): CommandeUI[] { return this.mesLivraisons.filter(c => c.statut === StatutCommande.EN_LIVRAISON); }
  get livrees():  CommandeUI[] { return this.mesLivraisons.filter(c => c.statut === StatutCommande.LIVREE); }

  constructor(
    public  auth:    AuthService,
    private cmdSvc:  CommandeService,
    private toast:   ToastService
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    const id = this.auth.currentUser!.id;
    this.cmdSvc.getCommandesDisponibles().subscribe(c => this.disponibles  = c as CommandeUI[]);
    this.cmdSvc.getMesLivraisons(id).subscribe(c => this.mesLivraisons = c as CommandeUI[]);
  }

  prendreEnCharge(cmd: CommandeUI): void {
    const u = this.auth.currentUser!;
    cmd._loading = true;
    this.cmdSvc.prendreEnCharge(cmd.id, u.id, `${u.prenom} ${u.nom}`).subscribe({
      next: (updated) => {
        if (updated) {
          // Retirer de disponibles + ajouter dans mesLivraisons avec nouvelles références
          this.disponibles = this.disponibles.filter(c => c.id !== cmd.id);
          const newCmd: CommandeUI = {
            ...updated,
            _loading: false
          };
          this.mesLivraisons = [newCmd, ...this.mesLivraisons];
          this.toast.show('🚗 Commande prise en charge !');
        } else {
          cmd._loading = false;
        }
      },
      error: () => { cmd._loading = false; }
    });
  }

  confirmerLivraison(cmd: CommandeUI): void {
    cmd._loading = true;
    this.cmdSvc.confirmerLivraison(cmd.id).subscribe({
      next: () => {
        // Créer un nouvel objet pour la commande avec statut LIVREE
        // → Angular détecte le changement, *ngIf="EN_LIVRAISON" = false, bouton disparaît
        this.mesLivraisons = this.mesLivraisons.map(c =>
          c.id === cmd.id
            ? { ...c, statut: StatutCommande.LIVREE, _loading: false }
            : c
        );
        this.toast.show('✅ Livraison confirmée !');
      },
      error: () => { cmd._loading = false; }
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
