import { Component, OnInit, inject, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoleService } from '../../core/services/role.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { RoleDto, CreateRoleDto, UpdateRoleDto, RoleQueryDto, ApiError } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SearchInputComponent,
    PaginationComponent,
  ],
  template: `
    <div class="role-admin-container">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Role Permissions</h1>
            <p class="page-subtitle">
              Configure platform roles and permission boundaries.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-add"
            (click)="openCreateModal()"
            aria-label="Add new role"
          >
            <span class="btn-icon" aria-hidden="true">+</span>
            <span>Add Role</span>
          </button>
        </div>
      </header>

      <!-- Filter, Search & Controls Bar -->
      <section class="controls-card" aria-label="Role Filters and Controls">
        <div class="controls-grid">
          <!-- Search Input -->
          <div class="search-box">
            <app-search-input
              [value]="searchQuery()"
              placeholder="Search roles by name or description..."
              ariaLabel="Search roles"
              (searchChange)="onSearchChange($event)"
            ></app-search-input>
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
                <option value="name">Role Name</option>
                <option value="createdat">Date Created</option>
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
          <div class="control-item">
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
        </div>
      </section>

      <!-- Main Content Area -->
      @if (loading() && roles().length === 0) {
        <div class="loading-state-wrapper">
          <app-loading-spinner [message]="'Loading roles...'"></app-loading-spinner>
        </div>
      } @else if (error() && roles().length === 0) {
        <app-error-state
          [title]="'Unable to load roles'"
          [message]="error()!"
          (retry)="loadRoles()"
        ></app-error-state>
      } @else if (roles().length === 0) {
        <app-empty-state
          [icon]="'🛡️'"
          [title]="'No Roles Found'"
          [message]="searchQuery() ? 'No platform roles matched your search query. Try adjusting your search keywords.' : 'No platform roles have been configured yet.'"
          [actionLabel]="searchQuery() ? 'Reset Search' : '+ Create Role'"
          (action)="searchQuery() ? resetFilters() : openCreateModal()"
        ></app-empty-state>
      } @else {
        <!-- Data Table -->
        <div class="card table-card">
          <div class="table-container">
            <table class="table" aria-label="Platform Roles List">
              <thead>
                <tr>
                  <th scope="col" style="width: 25%;">Role Name</th>
                  <th scope="col" style="width: 38%;">Description</th>
                  <th scope="col" style="width: 14%;">Users Assigned</th>
                  <th scope="col" style="width: 13%;">Created</th>
                  <th scope="col" style="width: 10%; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (role of roles(); track role.id) {
                  <tr>
                    <td class="role-name-cell">
                      <div class="role-name-wrapper">
                        <span class="role-icon" aria-hidden="true">🛡️</span>
                        <span class="role-name-text">{{ role.name }}</span>
                      </div>
                    </td>
                    <td class="role-desc-cell">
                      @if (role.description) {
                        <span class="role-desc" [title]="role.description">{{ role.description }}</span>
                      } @else {
                        <span class="text-muted italic">No description</span>
                      }
                    </td>
                    <td>
                      @if (role.userCount !== undefined) {
                        <span class="badge badge-users">
                          👥 {{ role.userCount }} {{ (role.userCount === 1) ? 'user' : 'users' }}
                        </span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td class="role-date-cell">
                      {{ role.createdAt | date: 'mediumDate' }}
                    </td>
                    <td class="role-actions-cell">
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="openEditModal(role)"
                          [attr.aria-label]="'Edit role ' + role.name"
                          title="Edit role"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="openDeleteModal(role)"
                          [attr.aria-label]="'Delete role ' + role.name"
                          title="Delete role"
                        >
                          Delete
                        </button>
                      </div>
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
            itemLabel="roles"
            ariaLabel="Roles pagination"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- Create / Edit Role Modal -->
      @if (isCreateEditModalOpen()) {
        <div class="modal-backdrop" (click)="onBackdropClick($event)">
          <div
            class="modal-dialog"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'role-modal-title'"
          >
            <header class="modal-header">
              <h2 id="role-modal-title" class="modal-title">
                {{ modalMode() === 'create' ? 'Create New Role' : 'Edit Role' }}
              </h2>
              <button
                type="button"
                class="modal-close-btn"
                (click)="closeCreateEditModal()"
                aria-label="Close dialog"
                [disabled]="saving()"
              >
                ✕
              </button>
            </header>

            <form [formGroup]="roleForm" (ngSubmit)="submitRoleForm()" novalidate>
              <div class="modal-body">
                <!-- Server error inside modal if any -->
                @if (modalError()) {
                  <div class="modal-alert modal-alert-error" role="alert">
                    <span class="alert-icon" aria-hidden="true">⚠️</span>
                    <span>{{ modalError() }}</span>
                  </div>
                }

                <!-- Role Name -->
                <div class="form-group">
                  <label for="role-name" class="form-label required">Role Name</label>
                  <input
                    id="role-name"
                    type="text"
                    formControlName="name"
                    class="form-control"
                    [class.is-invalid]="nameControl?.invalid && (nameControl?.dirty || nameControl?.touched)"
                    placeholder="e.g., Coordinator, Support, Auditor..."
                    maxlength="50"
                    autocomplete="off"
                  />
                  @if (nameControl?.invalid && (nameControl?.dirty || nameControl?.touched)) {
                    <div class="form-error">
                      @if (nameControl?.errors?.['required']) {
                        Role name is required.
                      }
                      @if (nameControl?.errors?.['maxlength']) {
                        Role name cannot exceed 50 characters.
                      }
                    </div>
                  }
                </div>

                <!-- Description -->
                <div class="form-group">
                  <div class="label-with-counter">
                    <label for="role-description" class="form-label">Description (Optional)</label>
                    <span class="char-counter">
                      {{ (descriptionControl?.value?.length || 0) }}/250
                    </span>
                  </div>
                  <textarea
                    id="role-description"
                    formControlName="description"
                    class="form-control"
                    rows="3"
                    placeholder="Briefly describe the responsibilities and permissions associated with this role..."
                    maxlength="250"
                  ></textarea>
                  @if (descriptionControl?.errors?.['maxlength']) {
                    <div class="form-error">
                      Description cannot exceed 250 characters.
                    </div>
                  }
                </div>
              </div>

              <footer class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="closeCreateEditModal()"
                  [disabled]="saving()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="roleForm.invalid || saving()"
                >
                  @if (saving()) {
                    <span class="spinner-sm" aria-hidden="true"></span>
                    <span>Saving...</span>
                  } @else {
                    <span>{{ modalMode() === 'create' ? 'Create Role' : 'Save Changes' }}</span>
                  }
                </button>
              </footer>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (isDeleteModalOpen() && roleToDelete()) {
        <div class="modal-backdrop" (click)="onDeleteBackdropClick($event)">
          <div
            class="modal-dialog modal-dialog-sm"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'delete-modal-title'"
          >
            <header class="modal-header modal-header-danger">
              <h2 id="delete-modal-title" class="modal-title text-danger">
                Delete Role
              </h2>
              <button
                type="button"
                class="modal-close-btn"
                (click)="closeDeleteModal()"
                aria-label="Close dialog"
                [disabled]="deleting()"
              >
                ✕
              </button>
            </header>

            <div class="modal-body">
              @if (deleteError()) {
                <div class="modal-alert modal-alert-error" role="alert">
                  <span class="alert-icon" aria-hidden="true">⚠️</span>
                  <span>{{ deleteError() }}</span>
                </div>
              }

              <div class="delete-warning-icon" aria-hidden="true">🗑️</div>
              <p class="delete-prompt">
                Are you sure you want to delete role
                <strong>"{{ roleToDelete()?.name }}"</strong>?
              </p>
              <p class="delete-subtext">
                This action is permanent and cannot be undone. Roles currently assigned to platform users cannot be deleted.
              </p>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeDeleteModal()"
                [disabled]="deleting()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                (click)="confirmDelete()"
                [disabled]="deleting()"
              >
                @if (deleting()) {
                  <span class="spinner-sm" aria-hidden="true"></span>
                  <span>Deleting...</span>
                } @else {
                  <span>Delete Role</span>
                }
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .role-admin-container {
      padding: var(--space-6) 0;
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-1);
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-weight-semibold);
      padding: var(--space-2) var(--space-4);
    }

    .btn-icon {
      font-size: 1.1rem;
      line-height: 1;
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
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4);
      align-items: flex-end;
    }

    .search-box {
      flex: 2;
      min-width: 260px;
    }

    .control-item {
      flex: 1;
      min-width: 140px;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .control-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
    }

    .sort-wrapper {
      display: flex;
      gap: var(--space-2);
    }

    .sort-dir-btn {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-xs);
    }

    .page-size-select {
      min-width: 80px;
    }

    /* Table Styles */
    .table-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .table-container {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);
    }

    .table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-600);
      font-weight: var(--font-weight-semibold);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .table td {
      padding: var(--space-4);
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
      color: var(--color-gray-800);
    }

    .table tbody tr:last-child td {
      border-bottom: none;
    }

    .table tbody tr:hover {
      background-color: var(--color-gray-50);
    }

    .role-name-cell {
      font-weight: var(--font-weight-medium);
    }

    .role-name-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .role-icon {
      font-size: 1rem;
    }

    .role-name-text {
      color: var(--color-gray-900);
    }

    .role-desc-cell {
      color: var(--color-gray-600);
    }

    .role-desc {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .role-date-cell {
      color: var(--color-gray-600);
      white-space: nowrap;
    }

    .role-actions-cell {
      text-align: right;
      white-space: nowrap;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
    }

    .badge-users {
      background-color: var(--color-primary-50, #eef2ff);
      color: var(--color-primary-700, #4338ca);
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-xs);
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full, 9999px);
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid var(--color-primary-200, #c7d2fe);
    }

    .text-muted {
      color: var(--color-gray-400);
    }

    .italic {
      font-style: italic;
    }

    /* Loading state wrapper */
    .loading-state-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      background-color: var(--bg-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      animation: slideDown 0.2s ease-out;
    }

    .modal-dialog-sm {
      max-width: 440px;
      text-align: center;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header-danger {
      border-bottom-color: var(--color-error-border, #fecaca);
      background-color: var(--color-error-bg, #fef2f2);
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .text-danger {
      color: var(--color-error-text, #b91c1c);
    }

    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: var(--space-1);
      line-height: 1;
      border-radius: var(--radius-sm);
    }

    .modal-close-btn:hover {
      color: var(--color-gray-700);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      background-color: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
    }

    .modal-alert {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
      text-align: left;
    }

    .modal-alert-error {
      background-color: var(--color-error-bg, #fef2f2);
      border: 1px solid var(--color-error-border, #fecaca);
      color: var(--color-error-text, #b91c1c);
    }

    .label-with-counter {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .char-counter {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
    }

    .form-group {
      margin-bottom: var(--space-4);
      text-align: left;
    }

    .form-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
      margin-bottom: var(--space-1);
    }

    .required::after {
      content: ' *';
      color: var(--color-error, #dc2626);
    }

    .form-control {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-gray-900);
      background-color: var(--bg-surface);
      transition: border-color 0.15s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary-500, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .form-control.is-invalid {
      border-color: var(--color-error, #dc2626);
    }

    .form-error {
      font-size: var(--font-size-xs);
      color: var(--color-error, #dc2626);
      margin-top: var(--space-1);
    }

    .delete-warning-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-3);
    }

    .delete-prompt {
      font-size: var(--font-size-base);
      color: var(--color-gray-800);
      margin-bottom: var(--space-2);
    }

    .delete-subtext {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin-bottom: 0;
      line-height: 1.5;
    }

    .spinner-sm {
      display: inline-block;
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.6s linear infinite;
      margin-right: var(--space-1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class RoleManagementComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly feedbackService = inject(UiFeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // Role State
  readonly roles = signal<RoleDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  // Filter & Search State
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Async Lifecycle State
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Modal State for Create & Edit
  readonly isCreateEditModalOpen = signal<boolean>(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly selectedRoleId = signal<string | null>(null);
  readonly saving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  // Modal State for Delete
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly roleToDelete = signal<RoleDto | null>(null);
  readonly deleting = signal<boolean>(false);
  readonly deleteError = signal<string | null>(null);

  roleForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(250)]],
  });

  get nameControl() {
    return this.roleForm.get('name');
  }

  get descriptionControl() {
    return this.roleForm.get('description');
  }

  ngOnInit(): void {
    if (this.route) {
      const snapshotParams = this.route.snapshot.queryParamMap;
      this.applyQueryParams(snapshotParams);

      this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        if (this.hasParamsChanged(params)) {
          this.applyQueryParams(params);
          this.loadRoles();
        }
      });
    }

    this.loadRoles();
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const sort = params.get('sortBy') || 'name';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

    this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 10 : size);
    this.searchQuery.set(search);
    this.sortBy.set(sort);
    this.sortDirection.set(dir);
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const sort = params.get('sortBy') || 'name';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

    return (
      page !== this.pageNumber() ||
      size !== this.pageSize() ||
      search !== this.searchQuery() ||
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
      sortBy: this.sortBy() !== 'name' ? this.sortBy() : null,
      sortDir: this.sortDirection() !== 'asc' ? this.sortDirection() : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  @HostListener('window:keydown.escape')
  onEscapePressed(): void {
    if (this.isCreateEditModalOpen() && !this.saving()) {
      this.closeCreateEditModal();
    } else if (this.isDeleteModalOpen() && !this.deleting()) {
      this.closeDeleteModal();
    }
  }

  loadRoles(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: RoleQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    if (this.searchQuery().trim()) {
      query.search = this.searchQuery().trim();
    }

    this.roleService.getRoles(query).subscribe({
      next: (result) => {
        this.roles.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to retrieve platform roles.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadRoles();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadRoles();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadRoles();
  }

  onPageSizeChange(event: Event | number): void {
    const size = typeof event === 'number' ? event : parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadRoles();
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadRoles();
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadRoles();
  }

  // Create & Edit Modal Actions
  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedRoleId.set(null);
    this.modalError.set(null);
    this.roleForm.reset({
      name: '',
      description: '',
    });
    this.isCreateEditModalOpen.set(true);
  }

  openEditModal(role: RoleDto): void {
    this.modalMode.set('edit');
    this.selectedRoleId.set(role.id);
    this.modalError.set(null);
    this.roleForm.reset({
      name: role.name,
      description: role.description || '',
    });
    this.isCreateEditModalOpen.set(true);
  }

  closeCreateEditModal(): void {
    this.isCreateEditModalOpen.set(false);
    this.modalError.set(null);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop') && !this.saving()) {
      this.closeCreateEditModal();
    }
  }

  submitRoleForm(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const rawValue = this.roleForm.value;
    this.saving.set(true);
    this.modalError.set(null);

    if (this.modalMode() === 'create') {
      const createDto: CreateRoleDto = {
        name: rawValue.name.trim(),
        description: rawValue.description?.trim() || undefined,
      };

      this.roleService.createRole(createDto).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.closeCreateEditModal();
          this.feedbackService.showSuccess(`Role "${created.name}" created successfully.`);
          this.loadRoles();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.modalError.set(err.message || 'Failed to create role.');
        },
      });
    } else {
      const id = this.selectedRoleId();
      if (!id) return;

      const updateDto: UpdateRoleDto = {
        name: rawValue.name.trim(),
        description: rawValue.description?.trim() || undefined,
      };

      this.roleService.updateRole(id, updateDto).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.closeCreateEditModal();
          this.feedbackService.showSuccess(`Role "${updated.name}" updated successfully.`);
          this.loadRoles();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.modalError.set(err.message || 'Failed to update role.');
        },
      });
    }
  }

  // Delete Modal Actions
  openDeleteModal(role: RoleDto): void {
    this.roleToDelete.set(role);
    this.deleteError.set(null);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.roleToDelete.set(null);
    this.deleteError.set(null);
  }

  onDeleteBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop') && !this.deleting()) {
      this.closeDeleteModal();
    }
  }

  confirmDelete(): void {
    const role = this.roleToDelete();
    if (!role) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.feedbackService.showSuccess(`Role "${role.name}" deleted successfully.`);
        if (this.roles().length === 1 && this.pageNumber() > 1) {
          this.pageNumber.update((p) => p - 1);
        }
        this.loadRoles();
      },
      error: (err: ApiError) => {
        this.deleting.set(false);
        const errMsg = err.message || 'Failed to delete role.';
        this.deleteError.set(errMsg);
        this.feedbackService.showError(errMsg);
      },
    });
  }
}
