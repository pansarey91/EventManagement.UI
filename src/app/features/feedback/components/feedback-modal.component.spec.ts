import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FeedbackModalComponent } from './feedback-modal.component';
import { FeedbackService } from '../../../core/services/feedback.service';
import { FeedbackDto } from '../../../core/models';

describe('FeedbackModalComponent', () => {
  let component: FeedbackModalComponent;
  let fixture: ComponentFixture<FeedbackModalComponent>;
  let feedbackServiceSpy: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const mockFeedback: FeedbackDto = {
    id: 'f-1',
    eventId: 'ev-1',
    eventName: 'Cloud Expo',
    userId: 'user-1',
    userName: 'John Doe',
    rating: 5,
    comment: 'Great sessions!',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
  };

  beforeEach(async () => {
    feedbackServiceSpy = {
      create: vi.fn().mockReturnValue(of(mockFeedback)),
      update: vi.fn().mockReturnValue(of(mockFeedback)),
    };

    await TestBed.configureTestingModule({
      imports: [FeedbackModalComponent],
      providers: [
        { provide: FeedbackService, useValue: feedbackServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackModalComponent);
    component = fixture.componentInstance;
    component.eventId = 'ev-1';
    component.eventName = 'Cloud Expo';
    fixture.detectChanges();
  });

  it('should create in create mode by default', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBe(false);
    expect(component.rating()).toBe(0);
  });

  it('should validate rating before submission', () => {
    component.submitFeedback();
    expect(component.ratingError()).toBe(true);
    expect(feedbackServiceSpy.create).not.toHaveBeenCalled();
  });

  it('should submit new feedback when rating is selected', () => {
    const savedSpy = vi.spyOn(component.saved, 'emit');
    component.onRatingSelected(5);
    component.commentValue = 'Great sessions!';

    component.submitFeedback();

    expect(feedbackServiceSpy.create).toHaveBeenCalledWith({
      eventId: 'ev-1',
      rating: 5,
      comment: 'Great sessions!',
    });
    expect(savedSpy).toHaveBeenCalledWith(mockFeedback);
  });

  it('should initialize in edit mode when existingFeedback is provided', () => {
    component.existingFeedback = mockFeedback;
    component.ngOnInit();

    expect(component.isEditMode()).toBe(true);
    expect(component.rating()).toBe(5);
    expect(component.comment()).toBe('Great sessions!');
  });
});
