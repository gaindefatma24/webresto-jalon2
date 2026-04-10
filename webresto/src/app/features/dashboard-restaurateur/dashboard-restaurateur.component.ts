/**
 * ================================================================
 * DashboardRestaurateurComponent — Tableau de bord restaurateur
 * ================================================================
 *
 * AMÉLIORATIONS v2 :
 *
 *   📷 UPLOAD D'IMAGE PAR SÉLECTION FICHIER (restaurant + plat)
 *   ────────────────────────────────────────────────────────────
 *   - FileReader API convertit l'image en base64
 *   - Conservée en mémoire (pas de serveur au Jalon I)
 *   - Aperçu instantané après sélection
 *   - Formats acceptés : JPG, PNG, WEBP, GIF
 *   - Taille max recommandée : 2 MB (encodage base64)
 *   - Au Jalon II → remplacer par un appel multipart/form-data vers S3/Cloudinary
 *
 *   🇨🇦 ADRESSE CANADIENNE STRUCTURÉE
 *   ────────────────────────────────────
 *   - Champs séparés : Numéro de rue + Rue, Ville, Code postal (A1A 1A1),
 *                       Province (select), Pays (fixé à Canada)
 *   - Validation du code postal : regex canadien [A-Z][0-9][A-Z] [0-9][A-Z][0-9]
 *   - L'adresse est reconstituée en chaîne pour l'affichage et la persistance
 *   - Compatible avec les champs d'adresse de livraison du CartComponent
 * ================================================================
 */

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestaurantService } from '../../core/services/restaurant.service';
import { CommandeService } from '../../core/services/commande.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StorageService, STORAGE_KEYS } from '../../core/services/storage.service';
import { Restaurant, Plat, Commande, StatutCommande, Categorie } from '../../core/models';

type ActiveTab = 'restaurants' | 'commandes';

/**
 * Validateur personnalisé pour le code postal canadien.
 * Format : A1A 1A1 (lettre-chiffre-lettre espace chiffre-lettre-chiffre)
 */
function canadianPostalCodeValidator(control: AbstractControl) {
  const val = (control.value || '').toUpperCase().trim();
  const regex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
  return regex.test(val) ? null : { postalCode: true };
}

@Component({
  selector: 'app-dashboard-restaurateur',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatCheckboxModule, MatProgressSpinnerModule, MatDividerModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="container">

        <!-- EN-TÊTE -->
        <div class="page-header">
          <div>
            <h1 class="page-title">🍽️ Dashboard Restaurateur</h1>
            <p class="page-subtitle">
              Bienvenue {{ auth.currentUser?.prenom }} — Gérez vos restaurants et commandes
            </p>
          </div>
          <button mat-flat-button color="primary"
                  *ngIf="activeTab === 'restaurants' && !showRestoForm && !selectedResto"
                  (click)="openRestoForm()">
            <mat-icon>add</mat-icon> Nouveau Restaurant
          </button>
        </div>

        <!-- ONGLETS -->
        <div class="tabs-bar">
          <button class="tab-btn" [class.active]="activeTab === 'restaurants'"
                  (click)="activeTab = 'restaurants'; selectedResto = null; showRestoForm = false">
            🏪 Mes Restaurants ({{ restaurants.length }})
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'commandes'"
                  (click)="activeTab = 'commandes'; loadCommandes()">
            📋 Commandes
            <span class="tab-badge" *ngIf="commandesEnAttente > 0">{{ commandesEnAttente }}</span>
          </button>
        </div>

        <!-- ══════════════════════════════════════════
             ONGLET RESTAURANTS
             ══════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'restaurants'">

          <!-- ────────────────────────────────────
               FORMULAIRE RESTAURANT (créer/modifier)
               ──────────────────────────────────── -->
          <mat-card class="form-card" *ngIf="showRestoForm">
            <mat-card-header>
              <mat-card-title>{{ editingResto ? 'Modifier le restaurant' : 'Nouveau restaurant' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
            <form [formGroup]="restoForm" (ngSubmit)="saveResto()">

              <!-- Nom + Catégorie -->
              <div class="form-row">
                <mat-form-field appearance="outline" style="flex:1.5">
                  <mat-label>Nom du restaurant</mat-label>
                  <input matInput formControlName="nom" placeholder="Ex: Pizza Montréal">
                  <mat-error *ngIf="isInvalid(restoForm,'nom')">Champ requis</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" style="flex:1">
                  <mat-label>Catégorie</mat-label>
                  <mat-select formControlName="categorieId" (selectionChange)="onCatChange()">
                    <mat-option *ngFor="let c of categories" [value]="c.id">{{ c.icon }} {{ c.nom }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="isInvalid(restoForm,'categorieId')">Champ requis</mat-error>
                </mat-form-field>
              </div>

              <!-- Description -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description"
                          placeholder="Décrivez votre restaurant..." rows="3"></textarea>
                <mat-error *ngIf="isInvalid(restoForm,'description')">Champ requis</mat-error>
              </mat-form-field>

              <!-- ── ADRESSE CANADIENNE STRUCTURÉE ── -->
              <div class="section-label">📍 Adresse</div>

              <div class="form-row">
                <mat-form-field appearance="outline" style="flex:1.5">
                  <mat-label>Numéro et rue</mat-label>
                  <input matInput formControlName="adresseRue" placeholder="Ex: 100 Rue Sainte-Catherine O">
                  <mat-icon matSuffix>signpost</mat-icon>
                  <mat-error *ngIf="isInvalid(restoForm,'adresseRue')">Champ requis</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" style="flex:1">
                  <mat-label>Ville</mat-label>
                  <input matInput formControlName="ville" placeholder="Ex: Montréal">
                  <mat-error *ngIf="isInvalid(restoForm,'ville')">Champ requis</mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Code postal</mat-label>
                  <input matInput formControlName="codePostal" placeholder="A1A 1A1"
                         maxlength="7" (input)="formatPostalCode($event)">
                  <mat-error *ngIf="isInvalid(restoForm,'codePostal')">Format invalide (ex: H3A 1B5)</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Province</mat-label>
                  <mat-select formControlName="province">
                    <mat-option *ngFor="let p of provinces" [value]="p.code">{{ p.nom }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="isInvalid(restoForm,'province')">Champ requis</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Pays</mat-label>
                  <input matInput formControlName="pays" readonly>
                  <mat-icon matSuffix>flag</mat-icon>
                </mat-form-field>
              </div>

              <!-- Téléphone -->
              <mat-form-field appearance="outline" style="max-width:280px">
                <mat-label>Téléphone</mat-label>
                <input matInput type="tel" formControlName="telephone" placeholder="514-555-0000">
                <mat-icon matSuffix>phone</mat-icon>
              </mat-form-field>

              <!-- ── UPLOAD IMAGE RESTAURANT ── -->
              <div class="section-label">📷 Photo du restaurant</div>
              <div class="image-upload-zone"
                   (click)="restoImageInput.click()"
                   (dragover)="$event.preventDefault()"
                   (drop)="onRestoDrop($event)">
                <div class="image-preview" *ngIf="restoImagePreview">
                  <img [src]="restoImagePreview" alt="Aperçu">
                  <button mat-icon-button type="button" class="image-remove"
                          (click)="$event.stopPropagation(); clearRestoImage()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="image-placeholder" *ngIf="!restoImagePreview">
                  <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  <p>Cliquez ou glissez une image ici</p>
                  <small>JPG, PNG, WEBP — max 2 MB</small>
                </div>
              </div>
              <input #restoImageInput type="file" accept="image/*" hidden
                     (change)="onRestoImageSelected($event)">

              <!-- Actions -->
              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="savingResto">
                  <mat-spinner *ngIf="savingResto" diameter="18"></mat-spinner>
                  {{ savingResto ? '' : (editingResto ? 'Modifier' : 'Créer') }}
                </button>
                <button mat-stroked-button type="button"
                        (click)="showRestoForm = false; editingResto = null; clearRestoImage()">
                  Annuler
                </button>
              </div>
            </form>
            </mat-card-content>
          </mat-card>

          <!-- ────────────────────────────────────
               GESTION DES PLATS
               ──────────────────────────────────── -->
          <div *ngIf="selectedResto && !showRestoForm">
            <div class="back-nav">
              <button mat-button (click)="selectedResto = null; platsList = []">
                <mat-icon>arrow_back</mat-icon> Retour
              </button>
              <h2 class="section-title">🍕 Plats de : {{ selectedResto.nom }}</h2>
              <button mat-flat-button color="primary" (click)="openPlatForm(null)">
                <mat-icon>add</mat-icon> Nouveau plat
              </button>
            </div>

            <!-- Formulaire plat -->
            <mat-card class="form-card" *ngIf="showPlatForm">
              <mat-card-header>
                <mat-card-title>{{ editingPlat ? 'Modifier le plat' : 'Nouveau plat' }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
              <form [formGroup]="platForm" (ngSubmit)="savePlat()">

                <div class="form-row">
                  <mat-form-field appearance="outline" style="flex:1.5">
                    <mat-label>Nom du plat</mat-label>
                    <input matInput formControlName="nom" placeholder="Ex: Margherita">
                    <mat-error *ngIf="isInvalid(platForm,'nom')">Champ requis</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="flex:0.6">
                    <mat-label>Prix ($)</mat-label>
                    <input matInput type="number" formControlName="prix"
                           placeholder="14.99" step="0.01" min="0">
                    <mat-icon matSuffix>attach_money</mat-icon>
                    <mat-error *ngIf="isInvalid(platForm,'prix')">Prix invalide</mat-error>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description"
                            placeholder="Ingrédients, préparation..." rows="3"></textarea>
                  <mat-error *ngIf="isInvalid(platForm,'description')">Champ requis</mat-error>
                </mat-form-field>

                <!-- ── UPLOAD IMAGE PLAT ── -->
                <div class="section-label">📷 Photo du plat</div>
                <div class="image-upload-zone"
                     (click)="platImageInput.click()"
                     (dragover)="$event.preventDefault()"
                     (drop)="onPlatDrop($event)">
                  <div class="image-preview" *ngIf="platImagePreview">
                    <img [src]="platImagePreview" alt="Aperçu">
                    <button mat-icon-button type="button" class="image-remove"
                            (click)="$event.stopPropagation(); clearPlatImage()">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                  <div class="image-placeholder" *ngIf="!platImagePreview">
                    <mat-icon class="upload-icon">cloud_upload</mat-icon>
                    <p>Cliquez ou glissez une image ici</p>
                    <small>JPG, PNG, WEBP — max 2 MB</small>
                  </div>
                </div>
                <input #platImageInput type="file" accept="image/*" hidden
                       (change)="onPlatImageSelected($event)">

                <!-- MatCheckbox pour disponibilité -->
                <mat-checkbox formControlName="disponible" color="primary" style="margin:1rem 0;display:block">
                  Disponible à la commande
                </mat-checkbox>

                <div class="form-actions">
                  <button mat-flat-button color="primary" type="submit" [disabled]="savingPlat">
                    <mat-spinner *ngIf="savingPlat" diameter="18"></mat-spinner>
                    {{ savingPlat ? '' : (editingPlat ? 'Modifier' : 'Ajouter') }}
                  </button>
                  <button mat-stroked-button type="button"
                          (click)="showPlatForm = false; editingPlat = null; clearPlatImage()">
                    Annuler
                  </button>
                </div>
              </form>
              </mat-card-content>
            </mat-card>

            <!-- Liste des plats -->
            <div *ngIf="!showPlatForm">
              <div *ngIf="platsList.length === 0" class="empty-state">
                <span class="empty-icon">🍽️</span>
                <p>Aucun plat pour ce restaurant</p>
              </div>
              <div class="plat-manage-card" *ngFor="let p of platsList">
                <div class="plat-manage-img" [style.background-image]="'url(' + p.imageUrl + ')'">
                  <span class="plat-dispo" [class.dispo]="p.disponible" [class.indispo]="!p.disponible">
                    {{ p.disponible ? '✅' : '🔴' }}
                  </span>
                </div>
                <div class="plat-manage-body">
                  <div class="plat-manage-name">{{ p.nom }}</div>
                  <div class="plat-manage-desc">{{ p.description }}</div>
                  <div class="plat-manage-prix">{{ p.prix | number:'1.2-2' }} $</div>
                </div>
                <div class="plat-manage-actions">
                  <button mat-icon-button (click)="openPlatForm(p)" matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deletePlat(p)" matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ────────────────────────────────────
               LISTE DES RESTAURANTS
               ──────────────────────────────────── -->
          <div *ngIf="!selectedResto && !showRestoForm">
            <div *ngIf="restaurants.length === 0" class="empty-state">
              <span class="empty-icon">🏪</span>
              <p>Vous n'avez pas encore de restaurant</p>
            </div>
            <div class="dash-resto-card" *ngFor="let r of restaurants">
              <div class="dash-resto-info">
                <div class="dash-resto-img"
                     [style.background-image]="'url(' + r.imageUrl + ')'"></div>
                <div>
                  <h3>{{ r.nom }}</h3>
                  <p>📍 {{ r.adresse }}, {{ r.ville }}</p>
                  <p style="color:var(--text-muted);font-size:.8rem">{{ r.categorie }}</p>
                  <span class="dash-badge active">Actif</span>
                </div>
              </div>
              <div class="dash-actions">
                <button mat-stroked-button (click)="openRestoForm(r)">
                  <mat-icon>edit</mat-icon> Modifier
                </button>
                <button mat-stroked-button color="primary" (click)="selectResto(r)">
                  <mat-icon>restaurant_menu</mat-icon> Gérer les plats
                </button>
                <button mat-stroked-button color="warn" (click)="deleteResto(r)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════
             ONGLET COMMANDES
             ══════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'commandes'">
          <div *ngIf="commandes.length === 0" class="empty-state">
            <span class="empty-icon">📋</span>
            <p>Aucune commande reçue</p>
          </div>
          <div class="cmd-card" *ngFor="let cmd of commandes">
            <div class="cmd-header">
              <div>
                <h3>Commande #{{ cmd.id }} — {{ cmd.restaurantNom }}</h3>
                <span class="cmd-date">{{ cmd.date }}</span>
                <span class="cmd-client" style="margin-left:.5rem">👤 {{ cmd.clientNom }}</span>
              </div>
              <span class="status-badge" [ngClass]="statusClass(cmd.statut)">
                {{ statusLabel(cmd.statut) }}
              </span>
            </div>
            <div class="cmd-items">
              <div class="cmd-item-row" *ngFor="let l of cmd.lignes">
                <span>{{ l.quantite }}× {{ l.nomPlat }}</span>
                <span>{{ l.sousTotal | number:'1.2-2' }} $</span>
              </div>
            </div>
            <div class="cmd-footer">
              <span class="cmd-addr">📍 {{ cmd.adresseLivraison }}</span>
              <span class="cmd-total">Total : {{ cmd.total | number:'1.2-2' }} $</span>
            </div>
            <div class="cmd-actions" *ngIf="cmd.statut === StatutCommande.EN_ATTENTE">
              <button mat-flat-button color="primary" (click)="accepter(cmd)">
                <mat-icon>check_circle</mat-icon> Accepter
              </button>
              <button mat-stroked-button color="warn" (click)="refuser(cmd)">
                <mat-icon>cancel</mat-icon> Refuser
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Onglets ── */
    .tabs-bar { display:flex; gap:.5rem; margin-bottom:2rem; border-bottom:1px solid var(--border); padding-bottom:0; }
    .tab-btn { padding:.75rem 1.5rem; background:transparent; border:none; border-bottom:2px solid transparent; color:var(--text-muted); cursor:pointer; font-family:var(--font-body); font-size:.92rem; font-weight:500; transition:all .2s; position:relative; margin-bottom:-1px; &.active{color:var(--accent);border-bottom-color:var(--accent);} &:hover{color:var(--text-primary);} }
    .tab-badge { display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;font-size:.7rem;font-weight:700;margin-left:.4rem; }

    /* ── Formulaires ── */
    .form-card { background:var(--bg-card) !important; border:1px solid var(--border) !important; border-radius:var(--radius) !important; margin-bottom:1.5rem; }
    .form-card mat-card-title { font-family:var(--font-display) !important; font-size:1.2rem !important; color:var(--accent) !important; }
    .form-card mat-card-header { padding-bottom:.5rem !important; }
    .form-card mat-card-content { padding-top:.5rem !important; }
    .full-width { width:100%; }
    .form-row { display:flex; gap:.75rem; flex-wrap:wrap; }
    .section-label { font-size:.82rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:1.25rem 0 .6rem; border-top:1px solid var(--border); padding-top:.85rem; }
    .form-actions { display:flex;gap:.75rem;margin-top:1.25rem; }

    /* ── Upload image ── */
    .image-upload-zone {
      border:2px dashed var(--border); border-radius:var(--radius);
      min-height:140px; cursor:pointer; transition:all .2s;
      display:flex;align-items:center;justify-content:center;
      background:var(--bg-input); position:relative; overflow:hidden;
      &:hover { border-color:var(--accent); background:var(--accent-soft); }
    }
    .image-placeholder { text-align:center; padding:1.5rem; pointer-events:none;
      .upload-icon { font-size:2rem; display:block; margin-bottom:.5rem; }
      p { color:var(--text-secondary);font-size:.9rem;margin-bottom:.25rem; }
      small { color:var(--text-muted);font-size:.78rem; }
    }
    .image-preview {
      width:100%; height:100%; min-height:140px; position:relative;
      img { width:100%; height:140px; object-fit:cover; display:block; }
    }
    .image-remove {
      position:absolute; top:.5rem; right:.5rem;
      width:28px; height:28px; border-radius:50%;
      background:rgba(0,0,0,.6); border:none; color:#fff;
      cursor:pointer; font-size:.9rem; display:flex; align-items:center; justify-content:center;
      &:hover { background:var(--danger); }
    }

    /* ── Restaurants liste ── */
    .dash-resto-card { background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.15rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:.65rem;flex-wrap:wrap;gap:.85rem; }
    .dash-resto-info { display:flex;gap:1rem;align-items:center; }
    .dash-resto-img { width:70px;height:60px;border-radius:var(--radius-sm);background-size:cover;background-position:center;flex-shrink:0;background-color:var(--bg-input); }
    .dash-resto-info h3 { font-size:1rem;margin-bottom:.2rem; }
    .dash-resto-info p { color:var(--text-muted);font-size:.82rem;margin-bottom:.1rem; }
    .dash-badge { display:inline-block;padding:.15rem .55rem;border-radius:50px;font-size:.72rem;font-weight:600;margin-top:.35rem; &.active{background:var(--success-bg);color:var(--success);} }
    .dash-actions { display:flex;gap:.4rem;flex-wrap:wrap; }
    .dash-btn { padding:.4rem .75rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:.8rem;font-family:var(--font-body);transition:all .2s; &:hover{border-color:var(--accent);color:var(--accent);} &.primary{border-color:var(--accent);color:var(--accent); &:hover{background:var(--accent);color:#fff;}} &.danger{border-color:var(--danger);color:var(--danger); &:hover{background:var(--danger);color:#fff;}} }

    /* ── Plats ── */
    .back-nav { display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap; }
    .plat-manage-card { background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);display:flex;align-items:center;gap:1rem;padding:.75rem 1rem;margin-bottom:.65rem;flex-wrap:wrap; }
    .plat-manage-img { width:80px;height:70px;border-radius:var(--radius-sm);background-size:cover;background-position:center;background-color:var(--bg-input);flex-shrink:0;position:relative; }
    .plat-dispo { position:absolute;bottom:.3rem;left:50%;transform:translateX(-50%);font-size:.7rem; }
    .plat-manage-body { flex:1;min-width:150px; }
    .plat-manage-name { font-weight:600;font-size:.95rem; }
    .plat-manage-desc { color:var(--text-muted);font-size:.82rem;margin:.2rem 0; }
    .plat-manage-prix { color:var(--accent);font-weight:700; }
    .plat-manage-actions { display:flex;gap:.4rem; }
  `]
})
export class DashboardRestaurateurComponent implements OnInit {

  activeTab: ActiveTab = 'restaurants';

  restaurants: Restaurant[] = [];
  platsList:   Plat[]       = [];
  commandes:   Commande[]   = [];
  categories:  Categorie[]  = [];

  selectedResto:  Restaurant | null = null;
  showRestoForm = false;
  showPlatForm  = false;
  editingResto: Restaurant | null = null;
  editingPlat:  Plat | null       = null;
  savingResto   = false;
  savingPlat    = false;

  /** Aperçus base64 des images sélectionnées */
  restoImagePreview: string | null = null;
  platImagePreview:  string | null = null;

  get commandesEnAttente(): number {
    return this.commandes.filter(c => c.statut === StatutCommande.EN_ATTENTE).length;
  }

  StatutCommande = StatutCommande;

  /**
   * Liste des provinces canadiennes.
   * Utilisée pour le <select> Province dans le formulaire d'adresse.
   */
  provinces = [
    { code: 'QC', nom: 'Québec' },
    { code: 'ON', nom: 'Ontario' },
    { code: 'BC', nom: 'Colombie-Britannique' },
    { code: 'AB', nom: 'Alberta' },
    { code: 'MB', nom: 'Manitoba' },
    { code: 'SK', nom: 'Saskatchewan' },
    { code: 'NS', nom: 'Nouvelle-Écosse' },
    { code: 'NB', nom: 'Nouveau-Brunswick' },
    { code: 'NL', nom: 'Terre-Neuve-et-Labrador' },
    { code: 'PE', nom: 'Île-du-Prince-Édouard' },
    { code: 'NT', nom: 'Territoires du Nord-Ouest' },
    { code: 'YT', nom: 'Yukon' },
    { code: 'NU', nom: 'Nunavut' }
  ];

  /**
   * Formulaire restaurant avec adresse canadienne structurée.
   * L'adresse est décomposée en 5 champs séparés pour la saisie,
   * puis reconstituée en chaîne pour le stockage et l'affichage.
   */
  restoForm = this.fb.group({
    nom:         ['', Validators.required],
    description: ['', Validators.required],
    categorieId: ['', Validators.required],
    categorie:   [''],
    telephone:   [''],
    // ── Adresse canadienne décomposée ──
    adresseRue:  ['', Validators.required],        // "100 Rue Sainte-Catherine O"
    ville:       ['', Validators.required],        // "Montréal"
    codePostal:  ['', [Validators.required, canadianPostalCodeValidator]], // "H3A 1B5"
    province:    ['QC', Validators.required],      // "QC"
    pays:        [{ value: 'Canada', disabled: true }] // Toujours Canada, non éditable
  });

  /** Formulaire plat */
  platForm = this.fb.group({
    nom:         ['', Validators.required],
    description: ['', Validators.required],
    prix:        [0, [Validators.required, Validators.min(0.01)]],
    disponible:  [true]
  });

  constructor(
    private fb:              FormBuilder,
    public  auth:            AuthService,
    private restoService:    RestaurantService,
    private commandeService: CommandeService,
    public  toast:           ToastService,
    private storage:         StorageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const userId = this.auth.currentUser!.id;
    this.restoService.getByProprietaire(userId).subscribe(r => this.restaurants = r);
    this.restoService.getCategories().subscribe(c => this.categories = c);
    this.loadCommandes();
  }

  loadCommandes(): void {
    const ids = this.restaurants.map(r => r.id);
    if (!ids.length) { this.commandes = []; return; }
    this.commandeService.getCommandesPourRestaurateur(ids)
      .subscribe(c => this.commandes = c);
  }

  // ────────────────────────────────────────────
  // UPLOAD D'IMAGES
  // ────────────────────────────────────────────

  /**
   * Lit un fichier image et le convertit en base64 via FileReader.
   * Le base64 est conservé en mémoire comme imageUrl.
   * Limite : 2 MB (taille raisonnable pour un encodage base64).
   *
   * @param file     - Fichier sélectionné
   * @param onResult - Callback appelé avec le data URL base64
   */
  private readImageFile(file: File, onResult: (base64: string) => void): void {
    if (file.size > 2 * 1024 * 1024) {
      this.toast.show('⚠️ Image trop grande (max 2 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onResult(e.target?.result as string);
    reader.readAsDataURL(file);  // Produit : "data:image/jpeg;base64,/9j/..."
  }

  /** Sélection d'image pour le restaurant via <input type="file"> */
  onRestoImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.readImageFile(file, b64 => this.restoImagePreview = b64);
  }

  /** Glisser-déposer d'image pour le restaurant */
  onRestoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/'))
      this.readImageFile(file, b64 => this.restoImagePreview = b64);
  }

  clearRestoImage(): void { this.restoImagePreview = null; }

  /** Sélection d'image pour le plat */
  onPlatImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.readImageFile(file, b64 => this.platImagePreview = b64);
  }

  /** Glisser-déposer d'image pour le plat */
  onPlatDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/'))
      this.readImageFile(file, b64 => this.platImagePreview = b64);
  }

  clearPlatImage(): void { this.platImagePreview = null; }

  // ────────────────────────────────────────────
  // FORMATAGE DU CODE POSTAL CANADIEN
  // ────────────────────────────────────────────

  /**
   * Formate automatiquement le code postal en A1A 1A1.
   * - Met en majuscules
   * - Insère l'espace au bon endroit
   * - Appelé à chaque frappe via (input)
   */
  formatPostalCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3) + ' ' + val.slice(3, 6);
    input.value = val;
    this.restoForm.get('codePostal')!.setValue(val, { emitEvent: false });
  }

  // ────────────────────────────────────────────
  // GESTION DES RESTAURANTS
  // ────────────────────────────────────────────

  openRestoForm(resto?: Restaurant): void {
    this.editingResto  = resto ?? null;
    this.showRestoForm = true;
    this.clearRestoImage();

    if (resto) {
      // Décompose l'adresse stockée en champs séparés
      const adresseDecomp = this.decomposeAdresse(resto.adresse);
      this.restoForm.patchValue({
        nom:         resto.nom,
        description: resto.description,
        telephone:   resto.telephone,
        categorieId: String(resto.categorieId),
        categorie:   resto.categorie,
        adresseRue:  adresseDecomp.rue,
        ville:       resto.ville,
        codePostal:  adresseDecomp.codePostal,
        province:    adresseDecomp.province || 'QC',
      });
      // Affiche l'image existante comme aperçu
      if (resto.imageUrl) this.restoImagePreview = resto.imageUrl;
    } else {
      this.restoForm.reset({ province: 'QC', pays: 'Canada' });
      this.restoForm.patchValue({ pays: 'Canada' });
    }
  }

  onCatChange(): void {
    const catId = Number(this.restoForm.get('categorieId')?.value);
    const cat   = this.categories.find(c => c.id === catId);
    if (cat) this.restoForm.patchValue({ categorie: cat.nom });
  }

  saveResto(): void {
    if (this.restoForm.invalid) { this.restoForm.markAllAsTouched(); return; }
    this.savingResto = true;
    const v = this.restoForm.getRawValue(); // getRawValue() inclut les champs disabled (pays)

    const catId = Number(v.categorieId);
    const cat   = this.categories.find(c => c.id === catId);

    // Reconstruit l'adresse complète canadienne
    const adresseComplete = this.buildAdresse(
      v.adresseRue!, v.ville!, v.codePostal!, v.province!, v.pays!
    );

    const data: Omit<Restaurant, 'id' | 'proprietaireId'> = {
      nom:         v.nom!,
      description: v.description!,
      adresse:     adresseComplete,
      ville:       v.ville!,
      telephone:   v.telephone || '',
      categorieId: catId,
      categorie:   cat?.nom ?? '',
      // Utilise l'image uploadée si disponible, sinon garde l'ancienne
      imageUrl:    this.restoImagePreview
                   ?? (this.editingResto?.imageUrl ?? '')
    };

    if (this.editingResto) {
      this.restoService.updateRestaurant(this.editingResto.id, data).subscribe(() => {
        this.savingResto = false; this.showRestoForm = false; this.editingResto = null;
        this.clearRestoImage();
        this.loadData();
        this.toast.show('✅ Restaurant modifié avec succès');
      });
    } else {
      this.restoService.createRestaurant(data, this.auth.currentUser!.id).subscribe(r => {
        this.savingResto = false; this.showRestoForm = false;
        this.clearRestoImage();
        this.loadData();
        this.toast.show(`✅ "${r.nom}" créé avec succès`);
      });
    }
  }

  deleteResto(r: Restaurant): void {
    if (!confirm(`Supprimer "${r.nom}" et tous ses plats ?`)) return;
    this.restoService.deleteRestaurant(r.id).subscribe(() => {
      this.loadData();
      this.toast.show(`🗑️ "${r.nom}" supprimé`);
    });
  }

  // ────────────────────────────────────────────
  // GESTION DES PLATS
  // ────────────────────────────────────────────

  selectResto(r: Restaurant): void {
    this.selectedResto = r;
    this.showPlatForm  = false;
    this.editingPlat   = null;
    this.restoService.getPlats(r.id).subscribe(p => this.platsList = p);
  }

  openPlatForm(plat: Plat | null): void {
    this.editingPlat  = plat;
    this.showPlatForm = true;
    this.clearPlatImage();
    if (plat) {
      this.platForm.patchValue({ ...plat });
      if (plat.imageUrl) this.platImagePreview = plat.imageUrl;
    } else {
      this.platForm.reset({ disponible: true });
    }
  }

  savePlat(): void {
    if (this.platForm.invalid) { this.platForm.markAllAsTouched(); return; }
    this.savingPlat = true;
    const v = this.platForm.value;

    const data: Omit<Plat, 'id'> = {
      nom:          v.nom!,
      description:  v.description!,
      prix:         Number(v.prix),
      disponible:   !!v.disponible,
      restaurantId: this.selectedResto!.id,
      imageUrl:     this.platImagePreview
                    ?? (this.editingPlat?.imageUrl ?? '')
    };

    if (this.editingPlat) {
      this.restoService.updatePlat(this.editingPlat.id, data).subscribe(() => {
        this.savingPlat = false; this.showPlatForm = false; this.editingPlat = null;
        this.clearPlatImage();
        this.selectResto(this.selectedResto!);
        this.toast.show('✅ Plat modifié');
      });
    } else {
      this.restoService.createPlat(data).subscribe(p => {
        this.savingPlat = false; this.showPlatForm = false;
        this.clearPlatImage();
        this.selectResto(this.selectedResto!);
        this.toast.show(`✅ "${p.nom}" ajouté`);
      });
    }
  }

  deletePlat(p: Plat): void {
    if (!confirm(`Supprimer "${p.nom}" ?`)) return;
    this.restoService.deletePlat(p.id).subscribe(() => {
      this.selectResto(this.selectedResto!);
      this.toast.show(`🗑️ "${p.nom}" supprimé`);
    });
  }

  // ────────────────────────────────────────────
  // GESTION DES COMMANDES
  // ────────────────────────────────────────────

  accepter(cmd: Commande): void {
    this.commandeService.updateStatut(cmd.id, StatutCommande.EN_PREPARATION).subscribe({
      next: () => {
        this.toast.show('✅ Commande acceptée — En préparation');
        this.loadCommandes();
      },
      error: () => this.toast.show('❌ Erreur lors de l\'acceptation')
    });
  }

  refuser(cmd: Commande): void {
    if (!confirm('Confirmer le refus ?')) return;
    this.commandeService.updateStatut(cmd.id, StatutCommande.ANNULEE).subscribe({
      next: () => {
        this.toast.show('❌ Commande refusée');
        this.loadCommandes();
      },
      error: () => this.toast.show('❌ Erreur lors du refus')
    });
  }

  // ────────────────────────────────────────────
  // UTILITAIRES ADRESSE CANADIENNE
  // ────────────────────────────────────────────

  /**
   * Reconstruit une adresse complète canadienne formatée.
   * Format : "100 Rue Sainte-Catherine O, Montréal, H3A 1B5, QC, Canada"
   */
  private buildAdresse(rue: string, ville: string, cp: string, prov: string, pays: string): string {
    const cpFormate = cp.toUpperCase().trim();
    return `${rue}, ${ville}, ${cpFormate}, ${prov}, ${pays}`;
  }

  /**
   * Décompose une adresse stockée pour pré-remplir le formulaire d'édition.
   * Tente de parser "rue, ville, CP, province, pays"
   */
  private decomposeAdresse(adresse: string): { rue: string; codePostal: string; province: string } {
    const parts = adresse.split(',').map(s => s.trim());
    return {
      rue:        parts[0] ?? adresse,
      codePostal: parts[2] ?? '',
      province:   parts[3] ?? 'QC'
    };
  }

  // ────────────────────────────────────────────
  // HELPERS D'AFFICHAGE
  // ────────────────────────────────────────────

  /** Vérifie si un champ est invalide ET touché (pour afficher les erreurs) */
  isInvalid(form: any, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  statusLabel(s: StatutCommande): string {
    const m: Record<StatutCommande, string> = {
      EN_ATTENTE: '⏳ En attente', EN_PREPARATION: '👨‍🍳 En préparation',
      EN_LIVRAISON: '🚗 En livraison', LIVREE: '✅ Livrée', ANNULEE: '❌ Annulée'
    };
    return m[s];
  }

  statusClass(s: StatutCommande): string {
    const m: Record<StatutCommande, string> = {
      EN_ATTENTE: 'status-attente', EN_PREPARATION: 'status-preparation',
      EN_LIVRAISON: 'status-livraison', LIVREE: 'status-livree', ANNULEE: 'status-annulee'
    };
    return m[s];
  }
}
