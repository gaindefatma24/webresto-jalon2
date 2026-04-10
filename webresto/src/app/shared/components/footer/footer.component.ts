import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `<footer class="footer"><p>© 2025 WebResto — Application de commande en ligne</p></footer>`,
  styles: [`
    .footer {
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      text-align: center;
      padding: 1.25rem;
      color: var(--text-muted);
      font-size: .82rem;
    }
  `]
})
export class FooterComponent {}
