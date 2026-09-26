import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { ComponentRef } from '@angular/core';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let componentRef: ComponentRef<PaginationComponent>;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate startIndex and endIndex correctly', () => {
    componentRef.setInput('pageNumber', 2);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 35);
    componentRef.setInput('totalPages', 4);
    fixture.detectChanges();

    expect(component.startIndex()).toBe(11);
    expect(component.endIndex()).toBe(20);
  });

  it('should cap endIndex at totalCount on the last page', () => {
    componentRef.setInput('pageNumber', 4);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 35);
    componentRef.setInput('totalPages', 4);
    fixture.detectChanges();

    expect(component.startIndex()).toBe(31);
    expect(component.endIndex()).toBe(35);
  });

  it('should compute visible pages properly when total pages <= 5', () => {
    componentRef.setInput('pageNumber', 2);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 30);
    componentRef.setInput('totalPages', 3);
    fixture.detectChanges();

    expect(component.visiblePages()).toEqual([1, 2, 3]);
  });

  it('should window visible pages around current page when total pages > 5', () => {
    componentRef.setInput('pageNumber', 5);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 100);
    componentRef.setInput('totalPages', 10);
    fixture.detectChanges();

    expect(component.visiblePages()).toEqual([3, 4, 5, 6, 7]);
  });

  it('should emit pageChange when valid page clicked', () => {
    const pageSpy = vi.fn();
    component.pageChange.subscribe(pageSpy);

    componentRef.setInput('pageNumber', 1);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 50);
    componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    component.goToPage(3);
    expect(pageSpy).toHaveBeenCalledWith(3);
  });

  it('should not emit pageChange if already on current page or out of range', () => {
    const pageSpy = vi.fn();
    component.pageChange.subscribe(pageSpy);

    componentRef.setInput('pageNumber', 2);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 50);
    componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    component.goToPage(2);
    expect(pageSpy).not.toHaveBeenCalled();

    component.goToPage(0);
    expect(pageSpy).not.toHaveBeenCalled();

    component.goToPage(10);
    expect(pageSpy).not.toHaveBeenCalled();
  });

  it('should not emit pageChange when loading', () => {
    const pageSpy = vi.fn();
    component.pageChange.subscribe(pageSpy);

    componentRef.setInput('pageNumber', 1);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 50);
    componentRef.setInput('totalPages', 5);
    componentRef.setInput('loading', true);
    fixture.detectChanges();

    component.goToPage(2);
    expect(pageSpy).not.toHaveBeenCalled();
  });

  it('should emit pageSizeChange when selector changes', () => {
    const sizeSpy = vi.fn();
    component.pageSizeChange.subscribe(sizeSpy);

    componentRef.setInput('pageNumber', 1);
    componentRef.setInput('pageSize', 10);
    componentRef.setInput('totalCount', 50);
    componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const mockEvent = {
      target: { value: '25' } as unknown as HTMLSelectElement,
    } as unknown as Event;

    component.onPageSizeSelect(mockEvent);
    expect(sizeSpy).toHaveBeenCalledWith(25);
  });
});
