import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackSummaryCardComponent } from './feedback-summary-card.component';
import { EventFeedbackSummaryDto } from '../../../core/models';

describe('FeedbackSummaryCardComponent', () => {
  let component: FeedbackSummaryCardComponent;
  let fixture: ComponentFixture<FeedbackSummaryCardComponent>;

  const mockSummary: EventFeedbackSummaryDto = {
    eventId: 'ev-1',
    totalFeedback: 10,
    averageRating: 4.5,
    ratingDistribution: {
      1: 0,
      2: 1,
      3: 1,
      4: 3,
      5: 5,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSummaryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackSummaryCardComponent);
    component = fixture.componentInstance;
    component.summary = mockSummary;
    fixture.detectChanges();
  });

  it('should create and display overall rating', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.score-number')?.textContent).toContain('4.5');
    expect(compiled.querySelector('.score-meta')?.textContent).toContain('10 reviews');
  });

  it('should calculate percentages correctly', () => {
    expect(component.getPercentage(5)).toBe(50);
    expect(component.getPercentage(3)).toBe(30);
    expect(component.getPercentage(1)).toBe(10);
  });

  it('should emit filterByRating when a star row is clicked', () => {
    const emitSpy = vi.spyOn(component.filterByRating, 'emit');
    component.onSelectRating(5);
    expect(emitSpy).toHaveBeenCalledWith(5);
    expect(component.selectedRating).toBe(5);

    // Clicking again toggles off
    component.onSelectRating(5);
    expect(emitSpy).toHaveBeenCalledWith(null);
    expect(component.selectedRating).toBeNull();
  });
});
