import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly isLoading = signal<boolean>(false);
  readonly message = signal<string | null>(null);

  show(message: string | null = null): void {
    this.message.set(message);
    this.isLoading.set(true);
  }

  hide(): void {
    this.isLoading.set(false);
    this.message.set(null);
  }

  setLoading(loading: boolean, message: string | null = null): void {
    if (loading) {
      this.show(message);
    } else {
      this.hide();
    }
  }
}
