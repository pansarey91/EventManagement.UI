import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MyFeedbackComponent } from './my-feedback.component';
import { FeedbackService } from '../../core/services/feedback.service';
import { FeedbackDto } from '../../core/models';

describe('MyFeedbackComponent', () => {
  let component: MyFeedbackComponent;
  let fixture: ComponentFixture<MyFeedbackComponent>;
  let feedbackServiceSpy: {
    getMyFeedback: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const mockFeedbacks: FeedbackDto[] = [
    {
      id: 'f-1',
      eventId: 'ev-1',
      eventName: 'AI Global Summit',
      userId: 'user-1',
      userName: 'John Doe',
      rating: 5,
      comment: 'Incredible speaker lineup and workshops!',
      createdAt: '2026-09-13T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'f-2',
      eventId: 'ev-2',
      eventName: 'TypeScript Workshop',
      userId: 'user-1',
      userName: 'John Doe',
      rating: 4,
      comment: 'Very practical examples.',
      createdAt: '2026-09-10T15:00:00Z',
      updatedAt: null,
    },
  ];

  beforeEach(async () => {
    feedbackServiceSpy = {
      getMyFeedback: vi.fn().mockReturnValue(of(mockFeedbacks)),
      delete: vi.fn().mockReturnValue(of(undefined)),
      update: vi.fn().mockReturnValue(of(mockFeedbacks[0])),
    };

    await TestBed.configureTestingModule({
      imports: [MyFeedbackComponent],
      providers: [
        provideRouter([]),
        { provide: FeedbackService, useValue: feedbackServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load user feedback on initialization', () => {
    expect(component).toBeTruthy();
    expect(feedbackServiceSpy.getMyFeedback).toHaveBeenCalled();
    expect(component.feedbacks().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should open edit modal with feedback item', () => {
    component.openEditModal(mockFeedbacks[0]);
    expect(component.editingFeedback()).toEqual(mockFeedbacks[0]);
  });

  it('should close edit modal', () => {
    component.openEditModal(mockFeedbacks[0]);
    component.closeEditModal();
    expect(component.editingFeedback()).toBeNull();
  });

  it('should update feedback list after editing', () => {
    const updated: FeedbackDto = {
      ...mockFeedbacks[0],
      comment: 'Updated amazing comment!',
      rating: 5,
    };

    component.onFeedbackUpdated(updated);
    expect(component.feedbacks()[0].comment).toBe('Updated amazing comment!');
  });
});
