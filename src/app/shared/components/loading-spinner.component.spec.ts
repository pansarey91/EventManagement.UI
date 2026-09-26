import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
  });

  it('should render inline spinner by default without overlay', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.loading-inline')).toBeTruthy();
    expect(compiled.querySelector('.loading-overlay')).toBeNull();
    expect(compiled.querySelector('.loading-text')).toBeNull();
  });

  it('should render custom message when message input is set', () => {
    fixture.componentRef.setInput('message', 'Loading event roster...');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-text')?.textContent).toBe('Loading event roster...');
  });

  it('should render fullscreen overlay when overlay input is true', () => {
    fixture.componentRef.setInput('overlay', true);
    fixture.componentRef.setInput('message', 'Processing payment...');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-overlay')).toBeTruthy();
    expect(compiled.querySelector('.spinner-lg')).toBeTruthy();
    expect(compiled.querySelector('.loading-text')?.textContent).toBe('Processing payment...');
  });
});
