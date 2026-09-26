import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingStarsComponent } from './rating-stars.component';

describe('RatingStarsComponent', () => {
  let component: RatingStarsComponent;
  let fixture: ComponentFixture<RatingStarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingStarsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingStarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in readonly mode by default', () => {
    expect(component).toBeTruthy();
    expect(component.readonly).toBe(true);
    expect(component.stars.length).toBe(5);
  });

  it('should emit ratingChange when interactive and star clicked', () => {
    component.readonly = false;
    fixture.detectChanges();

    const changeSpy = vi.spyOn(component.ratingChange, 'emit');
    component.selectRating(4);

    expect(changeSpy).toHaveBeenCalledWith(4);
    expect(component.rating).toBe(4);
  });

  it('should not emit ratingChange when readonly', () => {
    component.readonly = true;
    fixture.detectChanges();

    const changeSpy = vi.spyOn(component.ratingChange, 'emit');
    component.selectRating(4);

    expect(changeSpy).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation (ArrowRight and ArrowLeft)', () => {
    component.readonly = false;
    component.rating = 3;

    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    component.onKeyDown(rightEvent, 3);
    expect(component.rating).toBe(4);

    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    component.onKeyDown(leftEvent, 4);
    expect(component.rating).toBe(3);
  });
});
