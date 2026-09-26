import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForbiddenComponent } from './forbidden.component';
import { AuthorizationService } from '../../core/services/authorization.service';
import { signal } from '@angular/core';

describe('ForbiddenComponent', () => {
  let fixture: ComponentFixture<ForbiddenComponent>;
  let component: ForbiddenComponent;
  let authMock: {
    isAdmin: ReturnType<typeof signal<boolean>>;
    isOrganizer: ReturnType<typeof signal<boolean>>;
  };

  beforeEach(async () => {
    authMock = {
      isAdmin: signal<boolean>(false),
      isOrganizer: signal<boolean>(false),
    };

    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [
        provideRouter([]),
        { provide: AuthorizationService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('should render standard access denied message and common navigation', () => {
    fixture = TestBed.createComponent(ForbiddenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Access Denied');
    expect(compiled.textContent).toContain('403 Forbidden');
    expect(compiled.textContent).toContain('Browse Events');
    expect(compiled.textContent).toContain('My Profile');
    expect(compiled.textContent).not.toContain('Admin Center');
    expect(compiled.textContent).not.toContain('Organizer Hub');
  });

  it('should display Admin Center button when user has Admin role', () => {
    authMock.isAdmin.set(true);

    fixture = TestBed.createComponent(ForbiddenComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Admin Center');
  });

  it('should display Organizer Hub button when user has Organizer role', () => {
    authMock.isOrganizer.set(true);

    fixture = TestBed.createComponent(ForbiddenComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Organizer Hub');
  });
});
