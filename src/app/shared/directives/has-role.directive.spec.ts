import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HasRoleDirective } from './has-role.directive';
import { AuthorizationService } from '../../core/services/authorization.service';
import { signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [HasRoleDirective],
  template: `
    <div id="admin-only" *hasRole="'Admin'">Admin Content</div>
    <div id="org-or-admin" *hasRole="['Organizer', 'Admin']">Organizer Tools</div>
    <div id="with-else" *hasRole="'Admin'; else notAdminTpl">Has Admin Role</div>
    <ng-template #notAdminTpl><div id="fallback">Not An Admin</div></ng-template>
  `,
})
class TestHostComponent {}

describe('HasRoleDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let authMock: {
    roles: ReturnType<typeof signal<string[]>>;
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    hasRole: ReturnType<typeof vi.fn>;
    hasAnyRole: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authMock = {
      roles: signal<string[]>([]),
      isAuthenticated: signal<boolean>(false),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: AuthorizationService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('should not render elements when user has no roles', () => {
    authMock.roles.set([]);
    authMock.hasRole.mockReturnValue(false);
    authMock.hasAnyRole.mockReturnValue(false);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#admin-only')).toBeNull();
    expect(compiled.querySelector('#org-or-admin')).toBeNull();
    expect(compiled.querySelector('#fallback')).not.toBeNull();
  });

  it('should render elements when user possesses the required role', () => {
    authMock.roles.set(['Admin']);
    authMock.hasRole.mockImplementation((r: string) => r === 'Admin');
    authMock.hasAnyRole.mockImplementation((roles: string[]) => roles.includes('Admin'));

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#admin-only')).not.toBeNull();
    expect(compiled.querySelector('#org-or-admin')).not.toBeNull();
    expect(compiled.querySelector('#with-else')).not.toBeNull();
    expect(compiled.querySelector('#fallback')).toBeNull();
  });

  it('should render multi-role element when user has one of the allowed roles', () => {
    authMock.roles.set(['Organizer']);
    authMock.hasRole.mockImplementation((r: string) => r === 'Organizer');
    authMock.hasAnyRole.mockImplementation((roles: string[]) => roles.includes('Organizer'));

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#admin-only')).toBeNull();
    expect(compiled.querySelector('#org-or-admin')).not.toBeNull();
    expect(compiled.querySelector('#fallback')).not.toBeNull();
  });
});
