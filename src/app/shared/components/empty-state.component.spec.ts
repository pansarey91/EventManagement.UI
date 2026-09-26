import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyStateComponent } from './empty-state.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should render default properties when no inputs are provided', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.empty-state-icon')?.textContent).toBe('📭');
    expect(compiled.querySelector('.empty-state-title')?.textContent).toBe('No Data Found');
    expect(compiled.querySelector('.empty-state-desc')?.textContent).toBe('There are no items to display right now.');
    expect(compiled.querySelector('.empty-state-actions a')).toBeNull();
    expect(compiled.querySelector('.empty-state-actions button')).toBeNull();
  });

  it('should render custom icon, title, and message', () => {
    fixture.componentRef.setInput('icon', '🎟️');
    fixture.componentRef.setInput('title', 'No Tickets Registered');
    fixture.componentRef.setInput('message', 'You have not registered for any upcoming events.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state-icon')?.textContent).toBe('🎟️');
    expect(compiled.querySelector('.empty-state-title')?.textContent).toBe('No Tickets Registered');
    expect(compiled.querySelector('.empty-state-desc')?.textContent).toBe('You have not registered for any upcoming events.');
  });

  it('should render routerLink action when actionRoute is provided', () => {
    fixture.componentRef.setInput('actionLabel', 'Explore Events');
    fixture.componentRef.setInput('actionRoute', '/events');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.textContent?.trim()).toBe('Explore Events');
    expect(link.getAttribute('href')).toBe('/events');
  });

  it('should render button and emit action when actionLabel is provided without actionRoute', () => {
    const actionSpy = vi.fn();
    component.action.subscribe(actionSpy);

    fixture.componentRef.setInput('actionLabel', 'Reload Data');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Reload Data');

    button.click();
    expect(actionSpy).toHaveBeenCalled();
  });
});
