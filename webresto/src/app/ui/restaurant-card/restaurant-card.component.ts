import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Restaurant } from '../../core/models';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './restaurant-card.component.html',
  styleUrl: './restaurant-card.component.scss'
})
export class RestaurantCardComponent {
  @Input({ required: true }) restaurant!: Restaurant;

  constructor(public router: Router) {}

  naviguer(): void {
    this.router.navigate(['/restaurants', this.restaurant.id]);
  }
}
