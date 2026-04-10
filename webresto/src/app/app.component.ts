/**
 * ================================================================
 * AppComponent — Composant racine
 * ================================================================
 *
 * ngOnInit() charge les données JSON en mémoire via StorageService.
 * Aucune écriture dans localStorage — tout reste en RAM.
 * Un rechargement de page relit les JSON depuis assets/mock/.
 * ================================================================
 */

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './ui/navbar/navbar.component';
import { FooterComponent } from './ui/footer/footer.component';
import { StorageService } from './core/services/storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class AppComponent implements OnInit {
  constructor(private storage: StorageService) {}

  ngOnInit(): void {
    // Charge les JSON mock en mémoire — aucune écriture disque
    this.storage.init().subscribe({
      next: () => console.log('[WebResto] Données JSON chargées en mémoire'),
      error: err => console.error('[WebResto] Erreur chargement JSON:', err)
    });
  }
}
