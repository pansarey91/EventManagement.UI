import { Component, OnInit, inject, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../core/services/category.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  EventCategoryDto,
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
  EventCategoryQueryDto,
  ApiError,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-category-management',
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
    <div class="category-admin-container">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Event Categories</h1>
            <p class="page-subtitle">
              Organize and classify events to empower seamless discovery for attendees.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-add"
            (click)="openCreateModal()"
            aria-label="Add new category"
          >
            <span class="btn-icon" aria-hidden="true">+</span>
            <span>Add Category</span>
          </button>
        </div>
      </header>

      <!-- Filter, Search & Controls Bar -->
      <section class="controls-card" aria-label="Category Filters and Controls">
        <div class="controls-grid">
          <!-- Search Input -->
          <div class="search-box">
            <app-search-input
              [value]="searchQuery()"
              placeholder="Search by name or description..."
              ariaLabel="Search categories"
              (searchChange)="onSearchChange($event)"
            ></app-search-input>
          </div>

          <!-- Status Filter -->
          <div class="control-item">
            <label for="status-filter" class="control-label">Status</label>
            <select
              id="status-filter"
              class="form-select"
              [value]="statusFilter()"
              (change)="onStatusChange($event)"
            >
              <option value="all">All Statuses</option>
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
                <option value="name">Category Name</option>
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
      @if (loading() && categories().length === 0) {
        <div class="loading-state-wrapper">
          <app-loading-spinner [message]="'Loading categories...'"></app-loading-spinner>
        </div>
      } @else if (error() && categories().length === 0) {
        <app-error-state
          [title]="'Unable to load categories'"
          [message]="error()!"
          (retry)="loadCategories()"
        ></app-error-state>
      } @else if (categories().length === 0) {
        <app-empty-state
          [icon]="'🏷️'"
          [title]="'No Categories Found'"
          [message]="searchQuery() || statusFilter() !== 'all' ? 'No categories matched your search or filters. Try adjusting your query.' : 'No event categories have been created yet.'"
          [actionLabel]="searchQuery() || statusFilter() !== 'all' ? 'Reset Filters' : '+ Create Category'"
          (action)="searchQuery() || statusFilter() !== 'all' ? resetFilters() : openCreateModal()"
        ></app-empty-state>
      } @else {
        <!-- Data Table -->
        <div class="card table-card">
          <div class="table-container">
            <table class="table" aria-label="Event Categories List">
              <thead>
                <tr>
                  <th scope="col" style="width: 28%;">Name</th>
                  <th scope="col" style="width: 36%;">Description</th>
                  <th scope="col" style="width: 12%;">Status</th>
                  <th scope="col" style="width: 14%;">Created</th>
                  <th scope="col" style="width: 10%; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categories(); track cat.id) {
                  <tr>
                    <td class="category-name-cell">
                      <div class="category-name-wrapper">
                        <span class="category-icon" aria-hidden="true">🏷️</span>
                        <span class="category-name-text">{{ cat.name }}</span>
                      </div>
                    </td>
                    <td class="category-desc-cell">
                      @if (cat.description) {
                        <span class="category-desc" [title]="cat.description">{{ cat.description }}</span>
                      } @else {
                        <span class="text-muted italic">No description</span>
                      }
                    </td>
                    <td>
                      @if (cat.isActive) {
                        <span class="badge badge-active">Active</span>
                      } @else {
                        <span class="badge badge-inactive">Inactive</span>
                      }
                    </td>
                    <td class="category-date-cell">
                      {{ cat.createdAt | date: 'mediumDate' }}
                    </td>
                    <td class="category-actions-cell">
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="openEditModal(cat)"
                          [attr.aria-label]="'Edit category ' + cat.name"
                          title="Edit category"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="openDeleteModal(cat)"
                          [attr.aria-label]="'Delete category ' + cat.name"
                          title="Delete category"
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
            itemLabel="categories"
            ariaLabel="Categories pagination"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- Create / Edit Category Modal -->
      @if (isCreateEditModalOpen()) {
        <div class="modal-backdrop" (click)="onBackdropClick($event)">
          <div
            class="modal-dialog"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'category-modal-title'"
          >
            <header class="modal-header">
              <h2 id="category-modal-title" class="modal-title">
                {{ modalMode() === 'create' ? 'Create New Category' : 'Edit Category' }}
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

            <form [formGroup]="categoryForm" (ngSubmit)="submitCategoryForm()" novalidate>
              <div class="modal-body">
                <!-- Server error inside modal if any -->
                @if (modalError()) {
                  <div class="modal-alert modal-alert-error" role="alert">
                    <span class="alert-icon" aria-hidden="true">⚠️</span>
                    <span>{{ modalError() }}</span>
                  </div>
                }

                <!-- Category Name -->
                <div class="form-group">
                  <label for="cat-name" class="form-label required">Category Name</label>
                  <input
                    id="cat-name"
                    type="text"
                    formControlName="name"
                    class="form-control"
                    [class.is-invalid]="nameControl?.invalid && (nameControl?.dirty || nameControl?.touched)"
                    placeholder="e.g., Technology, Workshops, Music..."
                    maxlength="100"
                    autocomplete="off"
                  />
                  @if (nameControl?.invalid && (nameControl?.dirty || nameControl?.touched)) {
                    <div class="form-error">
                      @if (nameControl?.errors?.['required']) {
                        Category name is required.
                      }
                      @if (nameControl?.errors?.['maxlength']) {
                        Category name cannot exceed 100 characters.
                      }
                    </div>
                  }
                </div>

                <!-- Description -->
                <div class="form-group">
                  <div class="label-with-counter">
                    <label for="cat-description" class="form-label">Description (Optional)</label>
                    <span class="char-counter">
                      {{ (descriptionControl?.value?.length || 0) }}/500
                    </span>
                  </div>
                  <textarea
                    id="cat-description"
                    formControlName="description"
                    class="form-control"
                    rows="3"
                    placeholder="Briefly describe what kind of events belong in this category..."
                    maxlength="500"
                  ></textarea>
                  @if (descriptionControl?.errors?.['maxlength']) {
                    <div class="form-error">
                      Description cannot exceed 500 characters.
                    </div>
                  }
                </div>

                <!-- Active Status Toggle -->
                <div class="form-group checkbox-group">
                  <label class="checkbox-label" for="cat-is-active">
                    <input
                      id="cat-is-active"
                      type="checkbox"
                      formControlName="isActive"
                      class="checkbox-input"
                    />
                    <div class="checkbox-text">
                      <span class="checkbox-title">Active Category</span>
                      <span class="checkbox-desc">Active categories are available for selection when organizing events.</span>
                    </div>
                  </label>
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
                  [disabled]="categoryForm.invalid || saving()"
                >
                  @if (saving()) {
                    <span class="spinner-sm" aria-hidden="true"></span>
                    <span>Saving...</span>
                  } @else {
                    <span>{{ modalMode() === 'create' ? 'Create Category' : 'Save Changes' }}</span>
                  }
                </button>
              </footer>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (isDeleteModalOpen() && categoryToDelete()) {
        <div class="modal-backdrop" (click)="onDeleteBackdropClick($event)">
          <div
            class="modal-dialog modal-dialog-sm"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'delete-modal-title'"
          >
            <header class="modal-header modal-header-danger">
              <h2 id="delete-modal-title" class="modal-title text-danger">
                Delete Category
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
                Are you sure you want to delete category
                <strong>"{{ categoryToDelete()?.name }}"</strong>?
              </p>
              <p class="delete-subtext">
                This action is permanent and cannot be undone. Categories with associated events cannot be deleted.
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
                  <span>Delete Category</span>
                }
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .category-admin-container {
      width: 100%;
      max-width: var(--container-max-width);
      margin: 0 auto;
      padding: var(--space-4) 0;
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

    .input-wrapper {
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

    .search-field {
      padding-left: 2.25rem;
      padding-right: 2rem;
    }

    .clear-btn {
      position: absolute;
      right: var(--space-2);
      background: none;
      border: none;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: var(--space-1);
      font-size: 0.875rem;
    }

    .clear-btn:hover {
      color: var(--color-gray-700);
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

    .category-name-cell {
      font-weight: var(--font-weight-medium);
    }

    .category-name-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .category-icon {
      font-size: 1rem;
    }

    .category-name-text {
      color: var(--color-gray-900);
    }

    .category-desc-cell {
      color: var(--color-gray-600);
    }

    .category-desc {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .text-muted {
      color: var(--color-gray-400);
    }

    .italic {
      font-style: italic;
    }

    .category-date-cell {
      color: var(--color-gray-500);
      font-size: var(--font-size-xs);
      white-space: nowrap;
    }

    .category-actions-cell {
      text-align: right;
      white-space: nowrap;
    }

    .action-buttons {
      display: inline-flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    /* Status Badges */
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

    /* Pagination */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background-color: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
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
      transition: all 0.15s ease;
    }

    .page-num-btn:hover:not(.active):not(:disabled) {
      background-color: var(--color-gray-100);
    }

    .page-num-btn.active {
      background-color: var(--color-primary-600);
      color: #ffffff;
      border-color: var(--color-primary-600);
      font-weight: var(--font-weight-semibold);
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
      border-bottom-color: var(--color-error-border);
      background-color: var(--color-error-bg);
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .text-danger {
      color: var(--color-error-text);
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
    }

    .modal-alert-error {
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
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

    .checkbox-group {
      margin-top: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      cursor: pointer;
    }

    .checkbox-input {
      margin-top: 0.2rem;
      width: 1.1rem;
      height: 1.1rem;
      cursor: pointer;
    }

    .checkbox-text {
      display: flex;
      flex-direction: column;
    }

    .checkbox-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-800);
    }

    .checkbox-desc {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
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
    }

    .spinner-sm {
      display: inline-block;
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.6s linear infinite;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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
export class CategoryManagementComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly feedbackService = inject(UiFeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // Category State
  readonly categories = signal<EventCategoryDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  // Filter & Search State
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly sortBy = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Async Lifecycle State
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Modal State for Create & Edit
  readonly isCreateEditModalOpen = signal<boolean>(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly selectedCategoryId = signal<string | null>(null);
  readonly saving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  // Modal State for Delete
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly categoryToDelete = signal<EventCategoryDto | null>(null);
  readonly deleting = signal<boolean>(false);
  readonly deleteError = signal<string | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    isActive: [true],
  });

  get nameControl() {
    return this.categoryForm.get('name');
  }

  get descriptionControl() {
    return this.categoryForm.get('description');
  }

  ngOnInit(): void {
    if (this.route) {
      const snapshotParams = this.route.snapshot.queryParamMap;
      this.applyQueryParams(snapshotParams);

      this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        if (this.hasParamsChanged(params)) {
          this.applyQueryParams(params);
          this.loadCategories();
        }
      });
    }

    this.loadCategories();
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const statusParam = params.get('status');
    const status: 'all' | 'active' | 'inactive' =
      statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
    const sort = params.get('sortBy') || 'name';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

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
    const sort = params.get('sortBy') || 'name';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

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

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: EventCategoryQueryDto = {
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

    this.categoryService.getAll(query).subscribe({
      next: (result) => {
        this.categories.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to retrieve categories.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadCategories();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.onSearchChange(value);
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive';
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadCategories();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadCategories();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadCategories();
  }

  onPageSizeChange(event: Event | number): void {
    const size = typeof event === 'number' ? event : parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadCategories();
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadCategories();
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadCategories();
  }

  // Create & Edit Modal Actions
  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedCategoryId.set(null);
    this.modalError.set(null);
    this.categoryForm.reset({
      name: '',
      description: '',
      isActive: true,
    });
    this.isCreateEditModalOpen.set(true);
  }

  openEditModal(category: EventCategoryDto): void {
    this.modalMode.set('edit');
    this.selectedCategoryId.set(category.id);
    this.modalError.set(null);
    this.categoryForm.reset({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
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

  submitCategoryForm(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const rawValue = this.categoryForm.value;
    this.saving.set(true);
    this.modalError.set(null);

    if (this.modalMode() === 'create') {
      const createDto: CreateEventCategoryDto = {
        name: rawValue.name.trim(),
        description: rawValue.description?.trim() || null,
        isActive: !!rawValue.isActive,
      };

      this.categoryService.create(createDto).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.closeCreateEditModal();
          this.feedbackService.showSuccess(`Category "${created.name}" created successfully.`);
          this.loadCategories();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.modalError.set(err.message || 'Failed to create category.');
        },
      });
    } else {
      const id = this.selectedCategoryId();
      if (!id) return;

      const updateDto: UpdateEventCategoryDto = {
        name: rawValue.name.trim(),
        description: rawValue.description?.trim() || null,
        isActive: !!rawValue.isActive,
      };

      this.categoryService.update(id, updateDto).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.closeCreateEditModal();
          this.feedbackService.showSuccess(`Category "${updated.name}" updated successfully.`);
          this.loadCategories();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.modalError.set(err.message || 'Failed to update category.');
        },
      });
    }
  }

  // Delete Modal Actions
  openDeleteModal(category: EventCategoryDto): void {
    this.categoryToDelete.set(category);
    this.deleteError.set(null);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.categoryToDelete.set(null);
    this.deleteError.set(null);
  }

  onDeleteBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop') && !this.deleting()) {
      this.closeDeleteModal();
    }
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.feedbackService.showSuccess(`Category "${category.name}" deleted successfully.`);
        // If this was the last item on a page > 1, go back one page
        if (this.categories().length === 1 && this.pageNumber() > 1) {
          this.pageNumber.update((p) => p - 1);
        }
        this.loadCategories();
      },
      error: (err: ApiError) => {
        this.deleting.set(false);
        this.deleteError.set(err.message || 'Failed to delete category.');
      },
    });
  }
}
