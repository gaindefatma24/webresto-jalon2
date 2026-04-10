import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, duration = 2500): void {
    this.snackBar.open(message, '', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['webresto-toast']
    });
  }
}
