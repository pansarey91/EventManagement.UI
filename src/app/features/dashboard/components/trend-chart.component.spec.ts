import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendChartComponent } from './trend-chart.component';

describe('TrendChartComponent', () => {
  let component: TrendChartComponent;
  let fixture: ComponentFixture<TrendChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TrendChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create trend chart component', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when data is empty', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.chart-empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No activity recorded');
  });

  it('should render SVG bars when data is provided', () => {
    fixture.componentRef.setInput('data', [
      { label: '2026-09-01', value: 10, secondaryValue: 8 },
      { label: '2026-09-02', value: 25, secondaryValue: 20 },
      { label: '2026-09-03', value: 15, secondaryValue: 12 }
    ]);
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('.chart-bar-group');
    expect(bars.length).toBe(3);
    expect(component.maxValue()).toBe(25);
  });

  it('should toggle table view when toggle button is clicked', () => {
    fixture.componentRef.setInput('data', [
      { label: '2026-09-01', value: 100 }
    ]);
    fixture.detectChanges();

    expect(component.showTable()).toBe(false);
    const toggleBtn = fixture.nativeElement.querySelector('.chart-header-actions button');
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();

    expect(component.showTable()).toBe(true);
    const table = fixture.nativeElement.querySelector('.chart-table');
    expect(table).toBeTruthy();
  });

  it('should update hoveredIndex on hover', () => {
    fixture.componentRef.setInput('data', [
      { label: '2026-09-01', value: 50 }
    ]);
    fixture.detectChanges();

    expect(component.activeItem()).toBeNull();

    component.hoveredIndex.set(0);
    expect(component.activeItem()).not.toBeNull();
    expect(component.activeItem()?.item.value).toBe(50);
  });
});
