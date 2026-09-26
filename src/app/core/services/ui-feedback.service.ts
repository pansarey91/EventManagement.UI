import { Injectable, signal } from '@angular/core';

export interface AlertMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UiFeedbackService {
  readonly alerts = signal<AlertMessage[]>([]);

  showSuccess(message: string, title?: string): void {
    this.addAlert('success', message, title);
  }

  showError(message: string, title?: string): void {
    this.addAlert('error', message, title);
  }

  showWarning(message: string, title?: string): void {
    this.addAlert('warning', message, title);
  }

  showInfo(message: string, title?: string): void {
    this.addAlert('info', message, title);
  }

  dismissAlert(id: string): void {
    this.alerts.update((current) => current.filter((a) => a.id !== id));
  }

  clearAlerts(): void {
    this.alerts.set([]);
  }

  private addAlert(type: AlertMessage['type'], message: string, title?: string): void {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const alert: AlertMessage = { id, type, message, title };

    this.alerts.update((prev) => [...prev, alert]);

    // Auto dismiss after 6 seconds for non-error alerts
    if (type !== 'error') {
      setTimeout(() => this.dismissAlert(id), 6000);
    }
  }
}
