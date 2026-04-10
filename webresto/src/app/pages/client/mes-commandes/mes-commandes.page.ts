import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommandeCardComponent } from '../../../ui/commande-card/commande-card.component';
import { Commande, StatutCommande } from '../../../core/models';

@Component({
  selector: 'app-mes-commandes',
  standalone: true,
  imports: [CommonModule, MatIconModule, CommandeCardComponent],
  templateUrl: './mes-commandes.page.html',
  styleUrl: './mes-commandes.page.scss'
})
export class MesCommandesPage implements OnInit {

  commandes: Commande[] = [];

  constructor(
    private cmdSvc: CommandeService,
    private auth:   AuthService,
    private toast:  ToastService
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    this.cmdSvc.getMesCommandes(this.auth.currentUser!.id)
      .subscribe(c => this.commandes = c);
  }

  annuler(cmd: Commande): void {
    if (!confirm('Annuler cette commande ?')) return;
    this.cmdSvc.updateStatut(cmd.id, StatutCommande.ANNULEE).subscribe({
      next: () => { this.toast.show('Commande annulée'); this.charger(); },
      error: () => this.toast.show('❌ Erreur lors de l\'annulation')
    });
  }
}
