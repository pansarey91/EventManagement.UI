import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ErrorStateComponent', () => {
  let component: ErrorStateComponent;
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
  });

  it('should render default error card with title, message, and retry button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.error-title')?.textContent).toBe('An Error Occurred');
    expect(compiled.querySelector('.error-message')?.textContent).toContain('We were unable to complete your request');
    expect(compiled.querySelector('.error-trace-wrapper')).toBeNull();
    expect(compiled.querySelector('.error-actions button')).toBeTruthy();
  });

  it('should display correlation ID when provided', () => {
    fixture.componentRef.setInput('correlationId', 'CORR-98765-ABC');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const traceEl = compiled.querySelector('.trace-id');
    expect(traceEl).toBeTruthy();
    expect(traceEl?.textContent).toBe('CORR-98765-ABC');
  });

  it('should emit retry when retry button is clicked', () => {
    const retrySpy = vi.fn();
    component.retry.subscribe(retrySpy);

    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.error-actions button') as HTMLButtonElement;
    button.click();

    expect(retrySpy).toHaveBeenCalled();
  });

  it('should hide retry button when retryable is false', () => {
    fixture.componentRef.setInput('retryable', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-actions')).toBeNull();
  });
});
