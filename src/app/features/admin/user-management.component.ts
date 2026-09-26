import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../core/services/user.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { UserDto, UserQueryDto, ApiError } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SearchInputComponent,
    PaginationComponent,
  ],
  template: `
    <div class="user-admin-container">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">User Administration</h1>
            <p class="page-subtitle">
              Manage user accounts, monitor membership, and activate or deactivate platform access.
            </p>
          </div>
        </div>
      </header>

      <!-- Filter, Search & Controls Bar -->
      <section class="controls-card" aria-label="User Filters and Controls">
        <div class="controls-grid">
          <!-- Search Input -->
          <div class="search-box">
            <app-search-input
              [value]="searchQuery()"
              placeholder="Search by name or email..."
              ariaLabel="Search users"
              (searchChange)="onSearchChange($event)"
            ></app-search-input>
          </div>

          <!-- Status Filter -->
          <div class="control-item">
            <label for="status-filter" class="control-label">Account Status</label>
            <select
              id="status-filter"
              class="form-select"
              [value]="statusFilter()"
              (change)="onStatusChange($event)"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <!-- Sort By -->
          <div class="control-item">
            <label for="sort-by" class="control-label">Sort By</label>
            <div class="sort-wrapper">
              <select
                id="sort-by"
                class="form-select"
                [value]="sortBy()"
                (change)="onSortChange($event)"
              >
                <option value="createdAt">Date Registered</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="email">Email Address</option>
              </select>
              <button
                type="button"
                class="btn btn-secondary sort-dir-btn"
                (click)="toggleSortDirection()"
                [attr.aria-label]="sortDirection() === 'asc' ? 'Sort ascending. Click to sort descending' : 'Sort descending. Click to sort ascending'"
                title="Toggle sort direction"
              >
                {{ sortDirection() === 'asc' ? '↑ Asc' : '↓ Desc' }}
              </button>
            </div>
          </div>

          <!-- Page Size -->
          <div class="control-item page-size-control">
            <label for="page-size" class="control-label">Per Page</label>
            <select
              id="page-size"
              class="form-select page-size-select"
              [value]="pageSize()"
              (change)="onPageSizeChange($event)"
            >
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
            </select>
          </div>

          <!-- Reset Filters -->
          <div class="control-item reset-control">
            <button
              type="button"
              class="btn btn-outline-secondary reset-btn"
              (click)="resetFilters()"
              title="Reset all filters and search"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <!-- Main Content Area -->
      @if (loading()) {
        <div class="loading-state-wrapper">
          <app-loading-spinner message="Loading user directory..."></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [message]="error()!"
          (retry)="loadUsers()"
        ></app-error-state>
      } @else if (users().length === 0) {
        <app-empty-state
          title="No users found"
          message="No user accounts match your search criteria. Try modifying your filters."
          actionText="Clear Filters"
          (actionClicked)="resetFilters()"
        ></app-empty-state>
      } @else {
        <!-- Users Data Table Card -->
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table" aria-label="User accounts directory">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                  <th scope="col" class="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td class="user-name-cell">
                      <div class="user-avatar-wrap">
                        <div class="user-avatar" aria-hidden="true">
                          {{ user.firstName[0] || '' }}{{ user.lastName[0] || '' }}
                        </div>
                        <div class="user-identity">
                          <span class="user-full-name">{{ user.firstName }} {{ user.lastName }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="user-email-cell">
                      <span class="user-email">{{ user.email }}</span>
                    </td>
                    <td class="user-phone-cell">
                      @if (user.phoneNumber) {
                        <span>{{ user.phoneNumber }}</span>
                      } @else {
                        <span class="text-muted italic">None</span>
                      }
                    </td>
                    <td>
                      @if (user.isActive) {
                        <span class="badge badge-active">Active</span>
                      } @else {
                        <span class="badge badge-inactive">Inactive</span>
                      }
                    </td>
                    <td class="user-date-cell">
                      {{ user.createdAt | date: 'mediumDate' }}
                    </td>
                    <td class="user-actions-cell">
                      <button
                        type="button"
                        class="btn btn-sm"
                        [ngClass]="user.isActive ? 'btn-danger' : 'btn-primary'"
                        [disabled]="togglingUserId() === user.id"
                        (click)="toggleUserStatus(user)"
                        [attr.aria-label]="user.isActive ? 'Deactivate user ' + user.firstName : 'Activate user ' + user.firstName"
                      >
                        @if (togglingUserId() === user.id) {
                          <span class="spinner-sm" aria-hidden="true"></span>
                          <span>Updating...</span>
                        } @else if (user.isActive) {
                          <span>Deactivate</span>
                        } @else {
                          <span>Activate</span>
                        }
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <app-pagination
            [pageNumber]="pageNumber()"
            [pageSize]="pageSize()"
            [totalCount]="totalCount()"
            [totalPages]="totalPages()"
            [loading]="loading()"
            [pageSizeOptions]="[5, 10, 20, 50]"
            itemLabel="users"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) var(--space-4);
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-1) 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    /* Controls Bar */
    .controls-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .controls-grid {
      display: grid;
      grid-template-columns: 2fr repeat(2, 1fr) auto auto;
      gap: var(--space-3);
      align-items: flex-end;
    }

    @media (max-width: 900px) {
      .controls-grid {
        grid-template-columns: 1fr 1fr;
      }
      .search-box {
        grid-column: span 2;
      }
    }

    @media (max-width: 600px) {
      .controls-grid {
        grid-template-columns: 1fr;
      }
      .search-box {
        grid-column: span 1;
      }
    }

    .control-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .control-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
    }

    .form-control,
    .form-select {
      height: 2.375rem;
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-gray-900);
      background-color: #ffffff;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      width: 100%;
    }

    .form-control:focus,
    .form-select:focus {
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .sort-wrapper {
      display: flex;
      gap: var(--space-2);
    }

    .sort-dir-btn {
      white-space: nowrap;
      height: 2.375rem;
      padding: 0 var(--space-3);
    }

    .page-size-control {
      min-width: 5rem;
    }

    .reset-btn {
      height: 2.375rem;
      padding: 0 var(--space-3);
      white-space: nowrap;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-md);
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      line-height: 1.5;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-sm {
      height: 2rem;
      padding: 0 var(--space-3);
      font-size: var(--font-size-xs);
    }

    .btn-primary {
      background-color: var(--color-primary-600);
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-700);
    }

    .btn-secondary {
      background-color: var(--color-gray-100);
      border-color: var(--color-gray-300);
      color: var(--color-gray-700);
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: var(--color-gray-200);
    }

    .btn-outline-secondary {
      background-color: transparent;
      border-color: var(--border-color);
      color: var(--color-gray-600);
    }

    .btn-outline-secondary:hover:not(:disabled) {
      background-color: var(--color-gray-50);
      color: var(--color-gray-900);
    }

    .btn-danger {
      background-color: var(--color-error);
      color: #ffffff;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #b91c1c;
    }

    /* Data Table */
    .table-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);
    }

    .data-table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-700);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .data-table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      color: var(--color-gray-800);
      vertical-align: middle;
    }

    .data-table tbody tr:hover {
      background-color: var(--color-gray-50);
    }

    .user-avatar-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .user-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background-color: var(--color-primary-100);
      color: var(--color-primary-700);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .user-identity {
      display: flex;
      flex-direction: column;
    }

    .user-full-name {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-900);
    }

    .user-email {
      color: var(--color-gray-700);
      font-family: monospace;
      font-size: var(--font-size-xs);
    }

    .actions-header,
    .user-actions-cell {
      text-align: right;
    }

    .text-muted {
      color: var(--color-gray-400);
    }

    .italic {
      font-style: italic;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      line-height: 1.25;
    }

    .badge-active {
      background-color: var(--color-success-bg);
      color: var(--color-success-text);
      border: 1px solid var(--color-success-border);
    }

    .badge-inactive {
      background-color: var(--color-gray-100);
      color: var(--color-gray-600);
      border: 1px solid var(--color-gray-300);
    }

    /* Spinner */
    .spinner-sm {
      display: inline-block;
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.6s linear infinite;
    }

    .loading-state-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly feedbackService = inject(UiFeedbackService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // User State
  readonly users = signal<UserDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  // Filter & Search State
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly sortBy = signal<string>('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Async Lifecycle State
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly togglingUserId = signal<string | null>(null);

  ngOnInit(): void {
    if (this.route) {
      const snapshotParams = this.route.snapshot.queryParamMap;
      this.applyQueryParams(snapshotParams);

      this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        if (this.hasParamsChanged(params)) {
          this.applyQueryParams(params);
          this.loadUsers();
        }
      });
    }

    this.loadUsers();
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const statusParam = params.get('status');
    const status: 'all' | 'active' | 'inactive' =
      statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
    const sort = params.get('sortBy') || 'createdAt';
    const dir = params.get('sortDir') === 'asc' ? 'asc' : 'desc';

    this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 10 : size);
    this.searchQuery.set(search);
    this.statusFilter.set(status);
    this.sortBy.set(sort);
    this.sortDirection.set(dir);
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const statusParam = params.get('status');
    const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
    const sort = params.get('sortBy') || 'createdAt';
    const dir = params.get('sortDir') === 'asc' ? 'asc' : 'desc';

    return (
      page !== this.pageNumber() ||
      size !== this.pageSize() ||
      search !== this.searchQuery() ||
      status !== this.statusFilter() ||
      sort !== this.sortBy() ||
      dir !== this.sortDirection()
    );
  }

  private updateQueryParams(): void {
    if (!this.router || !this.route) return;

    const queryParams: Record<string, string | number | boolean | null> = {
      page: this.pageNumber() > 1 ? this.pageNumber() : null,
      pageSize: this.pageSize() !== 10 ? this.pageSize() : null,
      search: this.searchQuery().trim() || null,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : null,
      sortBy: this.sortBy() !== 'createdAt' ? this.sortBy() : null,
      sortDir: this.sortDirection() !== 'desc' ? this.sortDirection() : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: UserQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    if (this.searchQuery().trim()) {
      query.search = this.searchQuery().trim();
    }

    if (this.statusFilter() === 'active') {
      query.isActive = true;
    } else if (this.statusFilter() === 'inactive') {
      query.isActive = false;
    }

    this.userService.getUsers(query).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to retrieve user directory.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive';
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  onPageSizeChange(event: Event | number): void {
    const size = typeof event === 'number' ? event : parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadUsers();
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadUsers();
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  toggleUserStatus(user: UserDto): void {
    const newStatus = !user.isActive;
    this.togglingUserId.set(user.id);

    this.userService.updateUserStatus(user.id, { isActive: newStatus }).subscribe({
      next: (updatedUser) => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, isActive: updatedUser.isActive } : u))
        );
        this.togglingUserId.set(null);
        this.feedbackService.showSuccess(
          `User ${user.firstName} ${user.lastName} has been ${newStatus ? 'activated' : 'deactivated'}.`
        );
      },
      error: (err: ApiError) => {
        this.togglingUserId.set(null);
        this.feedbackService.showError(err.message || 'Failed to update user status.');
      },
    });
  }
}
