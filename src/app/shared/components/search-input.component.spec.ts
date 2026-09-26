import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';
import { ComponentRef } from '@angular/core';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let componentRef: ComponentRef<SearchInputComponent>;
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should debounce input emission', () => {
    const searchSpy = vi.fn();
    component.searchChange.subscribe(searchSpy);

    const input = fixture.nativeElement.querySelector('input');
    input.value = 'tech';
    input.dispatchEvent(new Event('input'));

    // Should not emit immediately
    expect(searchSpy).not.toHaveBeenCalled();

    // Advance timer past default 300ms
    vi.advanceTimersByTime(350);
    expect(searchSpy).toHaveBeenCalledWith('tech');
  });

  it('should not emit duplicate consecutive values', () => {
    const searchSpy = vi.fn();
    component.searchChange.subscribe(searchSpy);

    const input = fixture.nativeElement.querySelector('input');
    input.value = 'tech';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expect(searchSpy).toHaveBeenCalledTimes(1);

    // Type same value
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit immediately on clear button click', () => {
    const searchSpy = vi.fn();
    component.searchChange.subscribe(searchSpy);

    const input = fixture.nativeElement.querySelector('input');
    input.value = 'query';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expect(searchSpy).toHaveBeenCalledWith('query');

    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(searchSpy).toHaveBeenCalledWith('');
  });
});
