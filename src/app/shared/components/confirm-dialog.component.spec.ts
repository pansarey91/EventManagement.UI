import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ComponentRef } from '@angular/core';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let componentRef: ComponentRef<ConfirmDialogComponent>;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render dialog when isOpen is false', () => {
    componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.confirm-backdrop');
    expect(dialog).toBeNull();
  });

  it('should render dialog with title and message when isOpen is true', () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('title', 'Delete Event');
    componentRef.setInput('message', 'Are you sure you want to delete this event?');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.confirm-backdrop');
    expect(dialog).toBeTruthy();

    const titleEl = fixture.nativeElement.querySelector('#confirm-dialog-title');
    expect(titleEl.textContent.trim()).toBe('Delete Event');

    const descEl = fixture.nativeElement.querySelector('#confirm-dialog-desc');
    expect(descEl.textContent.trim()).toBe('Are you sure you want to delete this event?');
  });

  it('should emit confirmed when confirm button is clicked', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const confirmedSpy = vi.fn();
    component.confirmed.subscribe(confirmedSpy);

    const buttons = fixture.nativeElement.querySelectorAll('.confirm-footer button');
    const confirmBtn = buttons[1]; // second button is confirm
    confirmBtn.click();

    expect(confirmedSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancelled when cancel button is clicked', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    const buttons = fixture.nativeElement.querySelectorAll('.confirm-footer button');
    const cancelBtn = buttons[0]; // first button is cancel
    cancelBtn.click();

    expect(cancelledSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancelled when close (x) button is clicked', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    const closeBtn = fixture.nativeElement.querySelector('.confirm-close-btn');
    closeBtn.click();

    expect(cancelledSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancelled on Escape key when open and not loading', () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('loading', false);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelledSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit cancelled on Escape key when loading is true', () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('loading', true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelledSpy).not.toHaveBeenCalled();
  });

  it('should disable buttons and show spinner when loading is true', () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('loading', true);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.confirm-footer button');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);

    const spinner = fixture.nativeElement.querySelector('.btn-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should emit cancelled when clicking on backdrop', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    const backdrop = fixture.nativeElement.querySelector('.confirm-backdrop');
    backdrop.click();

    expect(cancelledSpy).toHaveBeenCalledTimes(1);
  });
});
