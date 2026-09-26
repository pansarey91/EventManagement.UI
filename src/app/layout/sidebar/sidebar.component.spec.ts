import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  const mockAuthService = {
    isAuthenticated: signal<boolean>(true),
    currentUser: signal<any>({ firstName: 'Bob' }),
    roles: signal<string[]>(['Attendee']),
    isAdmin: signal<boolean>(false),
    isOrganizer: signal<boolean>(false),
    isStaff: signal<boolean>(false),
    userFullName: signal<string>('Bob Doe'),
    logout: vi.fn()
  };

  const mockNotificationService = {
    unreadCount: signal<number>(3),
    recentNotifications: signal<any[]>([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should display unread notification badge in sidebar when unreadCount > 0', () => {
    const badge = fixture.nativeElement.querySelector('.badge-published');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('3');
  });

  it('should emit close on escape if open', () => {
    const spy = vi.spyOn(component.close, 'emit');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.onEscape();
    expect(spy).toHaveBeenCalled();
  });
});
