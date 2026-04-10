import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatBadgeModule,
    MatIconModule, MatMenuModule, MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  Role = Role;

  constructor(
    public auth:   AuthService,
    public cart:   CartService,
    public router: Router
  ) {}

  get roleLabel(): string {
    const m: Record<string, string> = {
      CLIENT: 'Client',
      RESTAURATEUR: 'Restaurateur',
      LIVREUR: 'Livreur'
    };
    return m[this.auth.currentUser?.role ?? ''] ?? '';
  }

  deconnecter(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
