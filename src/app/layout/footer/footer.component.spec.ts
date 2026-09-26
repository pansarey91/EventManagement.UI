import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the footer component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the current year and copyright notice', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const currentYear = new Date().getFullYear().toString();
    expect(compiled.querySelector('.copyright')?.textContent).toContain(currentYear);
    expect(compiled.querySelector('.copyright')?.textContent).toContain('EventSync Platform');
  });

  it('should display the backend status indicator', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status-indicator')?.textContent).toContain('Backend Phase 0 Ready');
  });
});
