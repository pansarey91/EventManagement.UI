import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventService } from '../../core/services/event.service';
import { CategoryService } from '../../core/services/category.service';
import { VenueService } from '../../core/services/venue.service';
import {
  PublicEventDto,
  EventDiscoveryQueryDto,
  EventCategoryDto,
  VenueDto,
  EventStatus,
  ApiError,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SearchInputComponent,
    PaginationComponent,
  ],
  template: `
    <div class="discover-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-text">
          <h1 class="page-title">Discover Events</h1>
          <p class="page-subtitle">
            Find and explore conferences, workshops, and community gatherings happening around you.
          </p>
        </div>
      </header>

      <!-- Search & Filters Section -->
      <section class="filter-card card" aria-label="Event Discovery Filters">
        <div class="card-body filter-grid">
          <!-- Keyword Search -->
          <div class="filter-item filter-search">
            <label class="filter-label">Search</label>
            <app-search-input
              [value]="searchQuery()"
              placeholder="Search by title, description, category, or city..."
              ariaLabel="Search events"
              (searchChange)="onSearchChange($event)"
            ></app-search-input>
          </div>

          <!-- Category Filter -->
          <div class="filter-item">
            <label for="category-select" class="filter-label">Category</label>
            <select
              id="category-select"
              class="form-select"
              [ngModel]="selectedCategoryId()"
              (ngModelChange)="onCategoryChange($event)"
            >
              <option value="">All Categories</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Venue Filter -->
          <div class="filter-item">
            <label for="venue-select" class="filter-label">Venue</label>
            <select
              id="venue-select"
              class="form-select"
              [ngModel]="selectedVenueId()"
              (ngModelChange)="onVenueChange($event)"
            >
              <option value="">All Venues</option>
              @for (venue of venues(); track venue.id) {
                <option [value]="venue.id">{{ venue.name }} ({{ venue.city }})</option>
              }
            </select>
          </div>

          <!-- Sort By -->
          <div class="filter-item">
            <label for="sort-select" class="filter-label">Sort By</label>
            <div class="sort-controls">
              <select
                id="sort-select"
                class="form-select"
                [ngModel]="sortBy()"
                (ngModelChange)="onSortByChange($event)"
              >
                <option value="startDate">Event Date</option>
                <option value="name">Event Name</option>
                <option value="createdAt">Recently Added</option>
              </select>
              <button
                type="button"
                class="btn btn-secondary sort-toggle-btn"
                (click)="toggleSortDirection()"
                [attr.aria-label]="sortDirection() === 'asc' ? 'Sort ascending. Click for descending' : 'Sort descending. Click for ascending'"
                title="Toggle sort direction"
              >
                {{ sortDirection() === 'asc' ? '↑' : '↓' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Secondary Filters Row (Upcoming, Price, Date Range) -->
        <div class="card-footer secondary-filters">
          <div class="checkbox-wrapper">
            <label class="checkbox-label" for="upcoming-only">
              <input
                id="upcoming-only"
                type="checkbox"
                [checked]="upcomingOnly()"
                (change)="onUpcomingOnlyChange($event)"
              />
              <span>Upcoming events only</span>
            </label>
          </div>

          <div class="filter-buttons">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              (click)="clearFilters()"
              [disabled]="!hasActiveFilters()"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Events Content Area -->
      @if (loading() && events().length === 0) {
        <div class="loading-state-wrapper">
          <app-loading-spinner [message]="'Discovering events...'"></app-loading-spinner>
        </div>
      } @else if (error() && events().length === 0) {
        <app-error-state
          [title]="'Unable to load events'"
          [message]="error()!"
          (retry)="loadEvents()"
        ></app-error-state>
      } @else if (events().length === 0) {
        <app-empty-state
          [icon]="'🎟️'"
          [title]="'No Events Found'"
          [message]="hasActiveFilters() ? 'No events matched your search or filters. Try adjusting your criteria.' : 'There are currently no public events available.'"
          [actionLabel]="hasActiveFilters() ? 'Clear Filters' : null"
          (action)="clearFilters()"
        ></app-empty-state>
      } @else {
        <!-- Event Cards Grid -->
        <section class="events-grid" aria-label="Available Events">
          @for (event of events(); track event.id) {
            <article class="card event-card">
              <!-- Banner Image or Visual Header -->
              <div class="card-image-wrapper">
                <div class="banner-fallback" aria-hidden="true">
                  <span class="fallback-icon">🎪</span>
                </div>
                @if (event.bannerImageUrl) {
                  <img
                    [src]="event.bannerImageUrl"
                    [alt]="event.name + ' banner'"
                    class="event-banner-img"
                    loading="lazy"
                    (error)="$any($event.target).style.display = 'none'"
                  />
                }
                <!-- Badges overlay -->
                <div class="image-badges">
                  @if (event.categoryName) {
                    <span class="badge badge-category">{{ event.categoryName }}</span>
                  }
                  @if (event.status === EventStatus.Ongoing) {
                    <span class="badge badge-ongoing">Ongoing</span>
                  } @else {
                    <span class="badge badge-published">Published</span>
                  }
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-body event-card-body">
                <div class="event-timing">
                  <span class="date-icon" aria-hidden="true">📅</span>
                  <time [attr.datetime]="event.startDateTime">
                    {{ event.startDateTime | date: 'mediumDate' }} • {{ event.startDateTime | date: 'shortTime' }}
                  </time>
                </div>

                <h2 class="event-title" [title]="event.name">
                  <a [routerLink]="['/events', event.id]" class="event-title-link">
                    {{ event.name }}
                  </a>
                </h2>

                <p class="event-desc">
                  {{ event.description || 'Join us for this exciting event!' }}
                </p>

                <div class="event-location">
                  <span class="location-icon" aria-hidden="true">📍</span>
                  <span class="location-text">
                    {{ event.venueName || 'Venue TBD' }}
                    @if (event.venueCity) {
                      ({{ event.venueCity }})
                    }
                  </span>
                </div>

                @if (event.organizerName) {
                  <div class="event-organizer">
                    <span class="organizer-label">Hosted by:</span>
                    <span class="organizer-name">{{ event.organizerName }}</span>
                  </div>
                }
              </div>

              <!-- Card Footer -->
              <footer class="card-footer event-card-footer">
                <div class="price-and-capacity">
                  <div class="event-price">
                    @if (event.minimumTicketPrice != null && event.minimumTicketPrice > 0) {
                      <span class="price-prefix">From</span>
                      <strong class="price-val">{{ event.minimumTicketPrice | currency }}</strong>
                    } @else {
                      <span class="price-free">Free Admission</span>
                    }
                  </div>

                  @if (event.availableTicketCount > 0) {
                    <span class="ticket-status in-stock">
                      {{ event.availableTicketCount }} spots left
                    </span>
                  } @else {
                    <span class="ticket-status sold-out">Check details</span>
                  }
                </div>

                <a [routerLink]="['/events', event.id]" class="btn btn-primary btn-sm btn-details">
                  View Details
                </a>
              </footer>
            </article>
          }
        </section>

        <!-- Pagination -->
        <app-pagination
          [pageNumber]="pageNumber()"
          [pageSize]="pageSize()"
          [totalCount]="totalCount()"
          [totalPages]="totalPages()"
          [loading]="loading()"
          [pageSizeOptions]="[6, 9, 18, 36]"
          itemLabel="events"
          ariaLabel="Events pagination"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-pagination>
      }
    </div>
  `,
  styles: [`
    .discover-container {
      width: 100%;
      max-width: var(--container-max-width);
      margin: 0 auto;
      padding: var(--space-4) 0;
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-2);
    }

    .page-subtitle {
      font-size: var(--font-size-base);
      color: var(--color-gray-600);
      margin: 0;
    }

    /* Filter Card */
    .filter-card {
      margin-bottom: var(--space-8);
      box-shadow: var(--shadow-sm);
      border-radius: var(--radius-lg);
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      align-items: end;
    }

    .filter-search {
      grid-column: span 2;
    }

    @media (max-width: 768px) {
      .filter-search {
        grid-column: span 1;
      }
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .filter-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      font-size: 0.875rem;
      color: var(--color-gray-400);
      pointer-events: none;
    }

    .search-input {
      padding-left: 2.25rem;
    }

    .sort-controls {
      display: flex;
      gap: var(--space-2);
    }

    .sort-toggle-btn {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .secondary-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background-color: var(--color-gray-50);
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .checkbox-wrapper {
      display: flex;
      align-items: center;
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
      cursor: pointer;
    }

    /* Events Grid */
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .event-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .card-image-wrapper {
      position: relative;
      height: 180px;
      overflow: hidden;
      background-color: var(--color-gray-100);
    }

    .event-banner-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .banner-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800));
    }

    .fallback-icon {
      font-size: 3rem;
    }

    .image-badges {
      position: absolute;
      top: var(--space-3);
      left: var(--space-3);
      right: var(--space-3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
    }

    .badge-category {
      background-color: rgba(15, 23, 42, 0.75);
      color: #ffffff;
      backdrop-filter: blur(4px);
    }

    .event-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-4);
      gap: var(--space-2);
    }

    .event-timing {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary-600);
    }

    .event-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0;
      line-height: 1.3;
    }

    .event-title-link {
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .event-title-link:hover {
      color: var(--color-primary-600);
    }

    .event-desc {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .event-location {
      display: flex;
      align-items: flex-start;
      gap: var(--space-1);
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin-top: auto;
      padding-top: var(--space-2);
    }

    .location-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-organizer {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .organizer-name {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
      margin-left: var(--space-1);
    }

    .event-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--border-color);
      background-color: var(--color-gray-50);
    }

    .price-and-capacity {
      display: flex;
      flex-direction: column;
    }

    .event-price {
      font-size: var(--font-size-sm);
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .price-prefix {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .price-val {
      color: var(--color-primary-700);
      font-size: var(--font-size-base);
    }

    .price-free {
      color: var(--color-success-text);
      font-weight: var(--font-weight-semibold);
    }

    .ticket-status {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .btn-details {
      padding: var(--space-2) var(--space-3);
    }

    /* Pagination */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .pagination-info {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .page-numbers {
      display: flex;
      gap: var(--space-1);
    }

    .page-num-btn {
      min-width: 2rem;
      height: 2rem;
      padding: 0 var(--space-2);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: #ffffff;
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-num-btn.active {
      background-color: var(--color-primary-600);
      color: #ffffff;
      border-color: var(--color-primary-600);
      font-weight: var(--font-weight-semibold);
    }

    .loading-state-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }
  `],
})
export class EventsListComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly categoryService = inject(CategoryService);
  private readonly venueService = inject(VenueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly EventStatus = EventStatus;

  // Data Signals
  readonly events = signal<PublicEventDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(9);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  // Dropdown Reference Data
  readonly categories = signal<EventCategoryDto[]>([]);
  readonly venues = signal<VenueDto[]>([]);

  // Filter & Query Signals
  readonly searchQuery = signal<string>('');
  readonly selectedCategoryId = signal<string>('');
  readonly selectedVenueId = signal<string>('');
  readonly upcomingOnly = signal<boolean>(false);
  readonly sortBy = signal<string>('startDate');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Async Status
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadReferenceData();

    // Read initial route query parameters
    const snapshotParams = this.route.snapshot.queryParamMap;
    this.applyQueryParams(snapshotParams);
    this.loadEvents();

    // React to browser back/forward navigation
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (this.hasParamsChanged(params)) {
        this.applyQueryParams(params);
        this.loadEvents();
      }
    });
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '9', 10);
    const search = params.get('search') || '';
    const cat = params.get('category') || '';
    const venue = params.get('venue') || '';
    const upcoming = params.get('upcoming') === 'true';
    const sort = params.get('sortBy') || 'startDate';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

    this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 9 : size);
    this.searchQuery.set(search);
    this.selectedCategoryId.set(cat);
    this.selectedVenueId.set(venue);
    this.upcomingOnly.set(upcoming);
    this.sortBy.set(sort);
    this.sortDirection.set(dir);
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '9', 10);
    const search = params.get('search') || '';
    const cat = params.get('category') || '';
    const venue = params.get('venue') || '';
    const upcoming = params.get('upcoming') === 'true';
    const sort = params.get('sortBy') || 'startDate';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

    return (
      page !== this.pageNumber() ||
      size !== this.pageSize() ||
      search !== this.searchQuery() ||
      cat !== this.selectedCategoryId() ||
      venue !== this.selectedVenueId() ||
      upcoming !== this.upcomingOnly() ||
      sort !== this.sortBy() ||
      dir !== this.sortDirection()
    );
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, string | number | boolean | null> = {
      page: this.pageNumber() > 1 ? this.pageNumber() : null,
      pageSize: this.pageSize() !== 9 ? this.pageSize() : null,
      search: this.searchQuery().trim() || null,
      category: this.selectedCategoryId() || null,
      venue: this.selectedVenueId() || null,
      upcoming: this.upcomingOnly() ? true : null,
      sortBy: this.sortBy() !== 'startDate' ? this.sortBy() : null,
      sortDir: this.sortDirection() !== 'asc' ? this.sortDirection() : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  loadReferenceData(): void {
    this.categoryService.getAll({ pageSize: 100, isActive: true }).subscribe({
      next: (res) => this.categories.set(res.items),
    });

    this.venueService.getAll({ pageSize: 100, isActive: true }).subscribe({
      next: (res) => this.venues.set(res.items),
    });
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: EventDiscoveryQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    if (this.searchQuery().trim()) query.search = this.searchQuery().trim();
    if (this.selectedCategoryId()) query.categoryId = this.selectedCategoryId();
    if (this.selectedVenueId()) query.venueId = this.selectedVenueId();
    if (this.upcomingOnly()) query.upcomingOnly = true;

    this.eventService.discover(query).subscribe({
      next: (res) => {
        this.events.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.pageNumber.set(res.pageNumber);
        this.hasPreviousPage.set(res.hasPreviousPage);
        this.hasNextPage.set(res.hasNextPage);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to load events.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onCategoryChange(catId: string): void {
    this.selectedCategoryId.set(catId);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onVenueChange(venueId: string): void {
    this.selectedVenueId.set(venueId);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onUpcomingOnlyChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.upcomingOnly.set(checked);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onSortByChange(sortBy: string): void {
    this.sortBy.set(sortBy);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadEvents();
    }
  }

  onPageSizeChange(size: number): void {
    if (size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadEvents();
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoryId.set('');
    this.selectedVenueId.set('');
    this.upcomingOnly.set(false);
    this.sortBy.set('startDate');
    this.sortDirection.set('asc');
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  hasActiveFilters(): boolean {
    return (
      !!this.searchQuery().trim() ||
      !!this.selectedCategoryId() ||
      !!this.selectedVenueId() ||
      this.upcomingOnly() ||
      this.sortBy() !== 'startDate' ||
      this.sortDirection() !== 'asc'
    );
  }
}
