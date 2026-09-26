import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { Subject } from 'rxjs';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let fixture: ComponentFixture<BreadcrumbsComponent>;
  let routerEvents$: Subject<any>;

  beforeEach(async () => {
    routerEvents$ = new Subject<any>();

    const mockRouter = {
      events: routerEvents$.asObservable(),
    };

    const mockActivatedRoute = {
      root: {
        children: [
          {
            // Simulate a child route with no snapshot during early initialization
            snapshot: undefined,
            children: [],
          },
        ],
        firstChild: null,
      },
    };

    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create without throwing when child snapshot is undefined', () => {
    expect(component).toBeTruthy();
    expect(component.breadcrumbs()).toEqual([{ label: 'Home', url: '/' }]);
  });

  it('should build breadcrumbs correctly when snapshots are present', () => {
    const mockRouteWithSnapshots = {
      root: {
        children: [],
        firstChild: {
          snapshot: {
            url: [{ path: 'events' }],
            data: { breadcrumb: 'Discover Events' },
          },
          children: [],
          firstChild: {
            snapshot: {
              url: [{ path: '123' }],
              data: { breadcrumb: 'Event Details' },
            },
            children: [],
            firstChild: null,
          },
        },
      },
    };

    (component as any).route = mockRouteWithSnapshots;
    routerEvents$.next(new NavigationEnd(1, '/events/123', '/events/123'));

    expect(component.breadcrumbs().length).toBe(3);
    expect(component.breadcrumbs()[0]).toEqual({ label: 'Home', url: '/' });
    expect(component.breadcrumbs()[1]).toEqual({ label: 'Discover Events', url: '/events' });
    expect(component.breadcrumbs()[2]).toEqual({ label: 'Event Details', url: '/events/123' });
  });

  it('should not add duplicate consecutive breadcrumbs', () => {
    const mockRouteWithDuplicates = {
      root: {
        children: [],
        firstChild: {
          snapshot: {
            url: [{ path: 'events' }],
            data: { breadcrumb: 'Events' },
          },
          children: [],
          firstChild: {
            snapshot: {
              url: [{ path: 'list' }],
              data: { breadcrumb: 'Events' },
            },
            children: [],
            firstChild: null,
          },
        },
      },
    };

    (component as any).route = mockRouteWithDuplicates;
    routerEvents$.next(new NavigationEnd(1, '/events/list', '/events/list'));

    expect(component.breadcrumbs().length).toBe(2);
    expect(component.breadcrumbs()[1].label).toBe('Events');
  });

  it('should safely unsubscribe on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
