import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommandeCardComponent } from '../../../ui/commande-card/commande-card.component';
import { Restaurant, Plat, Commande, StatutCommande, Categorie } from '../../../core/models';

type OngletActif = 'restaurants' | 'commandes';

function codePostalCanadienValidator(ctrl: AbstractControl) {
  const val = (ctrl.value || '').toUpperCase().trim();
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(val) ? null : { postalCode: true };
}

@Component({
  selector: 'app-tableau-de-bord-restaurateur',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatCheckboxModule, MatProgressSpinnerModule,
    MatDividerModule, MatTooltipModule,
    CommandeCardComponent
  ],
  templateUrl: './tableau-de-bord.page.html',
  styleUrl: './tableau-de-bord.page.scss'
})
export class TableauDeBordRestaurateurPage implements OnInit {

  @ViewChild('restoImageInput') restoImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('platImageInput')  platImageInput!:  ElementRef<HTMLInputElement>;

  ongletActif: OngletActif = 'restaurants';

  restaurants: Restaurant[] = [];
  platsDuResto: Plat[]      = [];
  commandes:    Commande[]  = [];
  categories:   Categorie[] = [];

  restoSelectionne:  Restaurant | null = null;
  afficherFormeResto = false;
  afficherFormePlat  = false;
  restoEnEdition:    Restaurant | null = null;
  platEnEdition:     Plat | null       = null;
  enregistrementResto = false;
  enregistrementPlat  = false;

  apercuImageResto: string | null = null;
  apercuImagePlat:  string | null = null;

  StatutCommande = StatutCommande;

  get commandesEnAttente(): number {
    return this.commandes.filter(c => c.statut === StatutCommande.EN_ATTENTE).length;
  }

  provinces = [
    { code: 'QC', nom: 'Québec' },        { code: 'ON', nom: 'Ontario' },
    { code: 'BC', nom: 'Colombie-Britannique' }, { code: 'AB', nom: 'Alberta' },
    { code: 'MB', nom: 'Manitoba' },       { code: 'SK', nom: 'Saskatchewan' },
    { code: 'NS', nom: 'Nouvelle-Écosse' },{ code: 'NB', nom: 'Nouveau-Brunswick' },
    { code: 'NL', nom: 'Terre-Neuve-et-Labrador' }, { code: 'PE', nom: 'Île-du-Prince-Édouard' },
    { code: 'NT', nom: 'Territoires du Nord-Ouest' }, { code: 'YT', nom: 'Yukon' }, { code: 'NU', nom: 'Nunavut' }
  ];

  formeResto = this.fb.group({
    nom:         ['', Validators.required],
    description: ['', Validators.required],
    categorieId: ['', Validators.required],
    categorie:   [''],
    telephone:   [''],
    rue:         ['', Validators.required],
    ville:       ['', Validators.required],
    codePostal:  ['', [Validators.required, codePostalCanadienValidator]],
    province:    ['QC', Validators.required],
    pays:        [{ value: 'Canada', disabled: true }]
  });

  formePlat = this.fb.group({
    nom:         ['', Validators.required],
    description: ['', Validators.required],
    prix:        [0, [Validators.required, Validators.min(0.01)]],
    disponible:  [true]
  });

  constructor(
    private fb:       FormBuilder,
    public  auth:     AuthService,
    private restoSvc: RestaurantService,
    private cmdSvc:   CommandeService,
    public  toast:    ToastService
  ) {}

  ngOnInit(): void { this.chargerDonnees(); }

  private chargerDonnees(): void {
    const userId = this.auth.currentUser!.id;
    this.restoSvc.getByProprietaire(userId).subscribe(r => {
      this.restaurants = r;
      this.chargerCommandes();
    });
    this.restoSvc.getCategories().subscribe(c => this.categories = c);
  }

  chargerCommandes(): void {
    const ids = this.restaurants.map(r => r.id);
    if (!ids.length) { this.commandes = []; return; }
    this.cmdSvc.getCommandesPourRestaurateur(ids).subscribe(c => this.commandes = c);
  }

  // ── Upload images ────────────────────────────────────────────
  private lireImage(file: File, cb: (b64: string) => void): void {
    if (file.size > 2 * 1024 * 1024) { this.toast.show('⚠️ Image trop grande (max 2 MB)'); return; }
    const reader = new FileReader();
    reader.onload = e => cb(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onImageRestoSelectionnee(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.lireImage(f, b => this.apercuImageResto = b);
  }
  onDropResto(e: DragEvent): void {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f?.type.startsWith('image/')) this.lireImage(f, b => this.apercuImageResto = b);
  }
  effacerImageResto(): void { this.apercuImageResto = null; }

  onImagePlatSelectionnee(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.lireImage(f, b => this.apercuImagePlat = b);
  }
  onDropPlat(e: DragEvent): void {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f?.type.startsWith('image/')) this.lireImage(f, b => this.apercuImagePlat = b);
  }
  effacerImagePlat(): void { this.apercuImagePlat = null; }

  // ── Formatage code postal ────────────────────────────────────
  formaterCodePostal(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) val = val.slice(0, 3) + ' ' + val.slice(3, 6);
    input.value = val;
    this.formeResto.get('codePostal')!.setValue(val, { emitEvent: false });
  }

  // ── CRUD Restaurants ─────────────────────────────────────────
  ouvrirFormeResto(resto?: Restaurant): void {
    this.restoEnEdition  = resto ?? null;
    this.afficherFormeResto = true;
    this.effacerImageResto();
    if (resto) {
      const parts = resto.adresse.split(',').map(s => s.trim());
      this.formeResto.patchValue({
        nom: resto.nom, description: resto.description,
        telephone: resto.telephone, categorieId: String(resto.categorieId),
        categorie: resto.categorie, rue: parts[0] ?? '',
        ville: resto.ville, codePostal: parts[2] ?? '',
        province: parts[3] ?? 'QC'
      });
      if (resto.imageUrl) this.apercuImageResto = resto.imageUrl;
    } else {
      this.formeResto.reset({ province: 'QC' });
      this.formeResto.patchValue({ pays: 'Canada' });
    }
  }

  onChangementCategorie(): void {
    const id  = Number(this.formeResto.get('categorieId')?.value);
    const cat = this.categories.find(c => c.id === id);
    if (cat) this.formeResto.patchValue({ categorie: cat.nom });
  }

  enregistrerResto(): void {
    if (this.formeResto.invalid) { this.formeResto.markAllAsTouched(); return; }
    this.enregistrementResto = true;
    const v   = this.formeResto.getRawValue();
    const catId = Number(v.categorieId);
    const cat   = this.categories.find(c => c.id === catId);
    const adresse = [v.rue, v.ville, v.codePostal?.toUpperCase(), v.province, v.pays].filter(Boolean).join(', ');
    const data: Omit<Restaurant, 'id' | 'proprietaireId'> = {
      nom: v.nom!, description: v.description!, adresse, ville: v.ville!,
      telephone: v.telephone || '', categorieId: catId, categorie: cat?.nom ?? '',
      imageUrl: this.apercuImageResto ?? (this.restoEnEdition?.imageUrl ?? '')
    };
    const obs = this.restoEnEdition
      ? this.restoSvc.updateRestaurant(this.restoEnEdition.id, data)
      : this.restoSvc.createRestaurant(data, this.auth.currentUser!.id);
    obs.subscribe(() => {
      this.enregistrementResto = false; this.afficherFormeResto = false;
      this.restoEnEdition = null; this.effacerImageResto(); this.chargerDonnees();
      this.toast.show(this.restoEnEdition ? '✅ Restaurant modifié' : '✅ Restaurant créé');
    });
  }

  supprimerResto(r: Restaurant): void {
    if (!confirm(`Supprimer "${r.nom}" et tous ses plats ?`)) return;
    this.restoSvc.deleteRestaurant(r.id).subscribe(() => {
      this.chargerDonnees(); this.toast.show(`🗑️ "${r.nom}" supprimé`);
    });
  }

  // ── CRUD Plats ───────────────────────────────────────────────
  selectionnerResto(r: Restaurant): void {
    this.restoSelectionne = r; this.afficherFormePlat = false; this.platEnEdition = null;
    this.restoSvc.getPlats(r.id).subscribe(p => this.platsDuResto = p);
  }

  ouvrirFormePlat(plat: Plat | null): void {
    this.platEnEdition = plat; this.afficherFormePlat = true; this.effacerImagePlat();
    if (plat) { this.formePlat.patchValue({ ...plat }); if (plat.imageUrl) this.apercuImagePlat = plat.imageUrl; }
    else       { this.formePlat.reset({ disponible: true }); }
  }

  enregistrerPlat(): void {
    if (this.formePlat.invalid) { this.formePlat.markAllAsTouched(); return; }
    this.enregistrementPlat = true;
    const v = this.formePlat.value;
    const data: Omit<Plat, 'id'> = {
      nom: v.nom!, description: v.description!, prix: Number(v.prix),
      disponible: !!v.disponible, restaurantId: this.restoSelectionne!.id,
      imageUrl: this.apercuImagePlat ?? (this.platEnEdition?.imageUrl ?? '')
    };
    const obs = this.platEnEdition
      ? this.restoSvc.updatePlat(this.platEnEdition.id, data)
      : this.restoSvc.createPlat(data);
    obs.subscribe(() => {
      this.enregistrementPlat = false; this.afficherFormePlat = false;
      this.platEnEdition = null; this.effacerImagePlat();
      this.selectionnerResto(this.restoSelectionne!);
      this.toast.show(this.platEnEdition ? '✅ Plat modifié' : '✅ Plat ajouté');
    });
  }

  supprimerPlat(p: Plat): void {
    if (!confirm(`Supprimer "${p.nom}" ?`)) return;
    this.restoSvc.deletePlat(p.id).subscribe(() => {
      this.selectionnerResto(this.restoSelectionne!); this.toast.show(`🗑️ "${p.nom}" supprimé`);
    });
  }

  // ── Commandes ────────────────────────────────────────────────
  accepterCommande(cmd: Commande): void {
    this.cmdSvc.updateStatut(cmd.id, StatutCommande.EN_PREPARATION).subscribe({
      next: () => { this.toast.show('✅ Commande acceptée'); this.chargerCommandes(); },
      error: () => this.toast.show('❌ Erreur')
    });
  }

  refuserCommande(cmd: Commande): void {
    if (!confirm('Confirmer le refus ?')) return;
    this.cmdSvc.updateStatut(cmd.id, StatutCommande.ANNULEE).subscribe({
      next: () => { this.toast.show('❌ Commande refusée'); this.chargerCommandes(); },
      error: () => this.toast.show('❌ Erreur')
    });
  }

  champInvalide(form: any, champ: string): boolean {
    const c = form.get(champ);
    return !!(c?.invalid && c?.touched);
  }
}
