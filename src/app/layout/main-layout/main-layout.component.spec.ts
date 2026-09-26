import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MainLayoutComponent } from './main-layout.component';
import { LoadingService } from '../../core/services/loading.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let isLoadingSignal: ReturnType<typeof signal<boolean>>;
  let loadingMessageSignal: ReturnType<typeof signal<string | null>>;

  const mockAuthService = {
    isAuthenticated: signal<boolean>(true),
    currentUser: signal<any>({ firstName: 'Test', lastName: 'User', email: 'test@example.com' }),
    roles: signal<string[]>(['Attendee']),
    isAdmin: signal<boolean>(false),
    isOrganizer: signal<boolean>(false),
    isStaff: signal<boolean>(false),
    userFullName: signal<string>('Test User'),
    logout: vi.fn(),
  };

  const mockNotificationService = {
    unreadCount: signal<number>(0),
    recentNotifications: signal<any[]>([]),
    loading: signal<boolean>(false),
    error: signal<string | null>(null),
    loadRecent: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    getNotificationIcon: () => '🔔',
    getNotificationNavigationUrl: () => '/notifications',
  };

  const mockFeedbackService = {
    alerts: signal<any[]>([]),
    dismissAlert: vi.fn(),
  };

  beforeEach(async () => {
    isLoadingSignal = signal<boolean>(false);
    loadingMessageSignal = signal<string | null>(null);

    const mockLoadingService = {
      isLoading: isLoadingSignal,
      message: loadingMessageSignal,
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiFeedbackService, useValue: mockFeedbackService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MainLayoutComponent with closed sidebar by default', () => {
    expect(component).toBeTruthy();
    expect(component.sidebarOpen()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.skip-link')).toBeTruthy();
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
  });

  it('should toggle and close sidebar state', () => {
    expect(component.sidebarOpen()).toBe(false);

    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);

    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(false);

    component.sidebarOpen.set(true);
    component.closeSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });

  it('should render loading overlay when loadingService.isLoading is true', () => {
    isLoadingSignal.set(true);
    loadingMessageSignal.set('Loading platform resources...');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-loading-spinner')).toBeTruthy();
    expect(compiled.textContent).toContain('Loading platform resources...');
  });
});
