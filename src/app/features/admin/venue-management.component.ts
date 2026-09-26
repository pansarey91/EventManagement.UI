import { Component, OnInit, inject, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VenueService } from '../../core/services/venue.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  VenueDto,
  CreateVenueDto,
  UpdateVenueDto,
  VenueQueryDto,
  ApiError,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-venue-management',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SearchInputComponent,
    PaginationComponent,
  ],
  template: `
    <div class="venue-admin-container">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Venue Directory</h1>
            <p class="page-subtitle">
              Register and maintain event venues, physical locations, and seating capacities.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-add"
            (click)="openCreateModal()"
            aria-label="Add new venue"
          >
            <span class="btn-icon" aria-hidden="true">+</span>
            <span>Add Venue</span>
          </button>
        </div>
      </header>

      <!-- Filter, Search & Controls Bar -->
      <section class="controls-card" aria-label="Venue Filters and Controls">
        <div class="controls-grid">
          <!-- Search Input -->
          <div class="search-box">
            <app-search-input
              [value]="searchQuery()"
              placeholder="Search by name, address, or city..."
              ariaLabel="Search venues"
              (searchChange)="onSearchChange($event)"
            ></app-search-input>
          </div>

          <!-- City Filter -->
          <div class="control-item">
            <label for="city-filter" class="control-label">City</label>
            <input
              id="city-filter"
              type="text"
              class="form-control"
              placeholder="Filter by city..."
              [value]="cityFilter()"
              (input)="onCityFilterInput($event)"
            />
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
                <option value="name">Venue Name</option>
                <option value="city">City</option>
                <option value="capacity">Capacity</option>
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
        </div>
      </section>

      <!-- Main Content Area -->
      @if (loading() && venues().length === 0) {
        <div class="loading-state-wrapper">
          <app-loading-spinner [message]="'Loading venues...'"></app-loading-spinner>
        </div>
      } @else if (error() && venues().length === 0) {
        <app-error-state
          [title]="'Unable to load venues'"
          [message]="error()!"
          (retry)="loadVenues()"
        ></app-error-state>
      } @else if (venues().length === 0) {
        <app-empty-state
          [icon]="'🏛️'"
          [title]="'No Venues Found'"
          [message]="searchQuery() || cityFilter() || statusFilter() !== 'all' ? 'No venues matched your search or filters. Try adjusting your query.' : 'No event venues have been registered yet.'"
          [actionLabel]="searchQuery() || cityFilter() || statusFilter() !== 'all' ? 'Reset Filters' : '+ Add Venue'"
          (action)="searchQuery() || cityFilter() || statusFilter() !== 'all' ? resetFilters() : openCreateModal()"
        ></app-empty-state>
      } @else {
        <!-- Data Table -->
        <div class="card table-card">
          <div class="table-container">
            <table class="table" aria-label="Event Venues List">
              <thead>
                <tr>
                  <th scope="col" style="width: 24%;">Venue Name</th>
                  <th scope="col" style="width: 26%;">Address & Location</th>
                  <th scope="col" style="width: 12%;">Capacity</th>
                  <th scope="col" style="width: 18%;">Contact Info</th>
                  <th scope="col" style="width: 8%;">Status</th>
                  <th scope="col" style="width: 12%; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (venue of venues(); track venue.id) {
                  <tr>
                    <td class="venue-name-cell">
                      <div class="venue-name-wrapper">
                        <span class="venue-icon" aria-hidden="true">🏛️</span>
                        <div>
                          <div class="venue-name-text">{{ venue.name }}</div>
                          <div class="venue-created-subtext">Added {{ venue.createdAt | date: 'mediumDate' }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="venue-location-cell">
                      <div class="location-address">{{ venue.address }}</div>
                      <div class="location-city-state">
                        {{ venue.city }}, {{ venue.state }}
                        @if (venue.postalCode) {
                          ({{ venue.postalCode }})
                        }
                        - {{ venue.country }}
                      </div>
                    </td>
                    <td class="venue-capacity-cell">
                      <span class="capacity-pill" title="Maximum capacity">
                        👥 {{ venue.capacity | number }}
                      </span>
                    </td>
                    <td class="venue-contact-cell">
                      @if (venue.contactPerson || venue.contactNumber) {
                        @if (venue.contactPerson) {
                          <div class="contact-person">{{ venue.contactPerson }}</div>
                        }
                        @if (venue.contactNumber) {
                          <div class="contact-number">{{ venue.contactNumber }}</div>
                        }
                      } @else {
                        <span class="text-muted italic">No contact specified</span>
                      }
                    </td>
                    <td>
                      @if (venue.isActive) {
                        <span class="badge badge-active">Active</span>
                      } @else {
                        <span class="badge badge-inactive">Inactive</span>
                      }
                    </td>
                    <td class="venue-actions-cell">
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="openEditModal(venue)"
                          [attr.aria-label]="'Edit venue ' + venue.name"
                          title="Edit venue"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="openDeleteModal(venue)"
                          [attr.aria-label]="'Delete venue ' + venue.name"
                          title="Delete venue"
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
            itemLabel="venues"
            ariaLabel="Venues pagination"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- Create / Edit Venue Modal -->
      @if (isCreateEditModalOpen()) {
        <div class="modal-backdrop" (click)="onBackdropClick($event)">
          <div
            class="modal-dialog modal-dialog-lg"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'venue-modal-title'"
          >
            <header class="modal-header">
              <h2 id="venue-modal-title" class="modal-title">
                {{ modalMode() === 'create' ? 'Add New Venue' : 'Edit Venue' }}
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

            <form [formGroup]="venueForm" (ngSubmit)="submitVenueForm()" novalidate>
              <div class="modal-body modal-scrollable">
                <!-- Server error alert inside modal -->
                @if (modalError()) {
                  <div class="modal-alert modal-alert-error" role="alert">
                    <span class="alert-icon" aria-hidden="true">⚠️</span>
                    <span>{{ modalError() }}</span>
                  </div>
                }

                <!-- Venue Name -->
                <div class="form-group">
                  <label for="venue-name" class="form-label required">Venue Name</label>
                  <input
                    id="venue-name"
                    type="text"
                    formControlName="name"
                    class="form-control"
                    [class.is-invalid]="nameControl?.invalid && (nameControl?.dirty || nameControl?.touched)"
                    placeholder="e.g., Grand Exhibition Center, Civic Hall..."
                    maxlength="150"
                    autocomplete="off"
                  />
                  @if (nameControl?.invalid && (nameControl?.dirty || nameControl?.touched)) {
                    <div class="form-error">
                      @if (nameControl?.errors?.['required']) {
                        Venue name is required.
                      }
                      @if (nameControl?.errors?.['maxlength']) {
                        Venue name cannot exceed 150 characters.
                      }
                    </div>
                  }
                </div>

                <!-- Street Address -->
                <div class="form-group">
                  <label for="venue-address" class="form-label required">Street Address</label>
                  <input
                    id="venue-address"
                    type="text"
                    formControlName="address"
                    class="form-control"
                    [class.is-invalid]="addressControl?.invalid && (addressControl?.dirty || addressControl?.touched)"
                    placeholder="e.g., 100 Main St, Suite 400"
                    maxlength="250"
                  />
                  @if (addressControl?.invalid && (addressControl?.dirty || addressControl?.touched)) {
                    <div class="form-error">
                      @if (addressControl?.errors?.['required']) {
                        Street address is required.
                      }
                      @if (addressControl?.errors?.['maxlength']) {
                        Address cannot exceed 250 characters.
                      }
                    </div>
                  }
                </div>

                <!-- Location Grid: City, State, Country, Postal Code -->
                <div class="form-row-grid">
                  <div class="form-group">
                    <label for="venue-city" class="form-label required">City</label>
                    <input
                      id="venue-city"
                      type="text"
                      formControlName="city"
                      class="form-control"
                      [class.is-invalid]="cityControl?.invalid && (cityControl?.dirty || cityControl?.touched)"
                      placeholder="e.g., Chicago"
                      maxlength="100"
                    />
                    @if (cityControl?.invalid && (cityControl?.dirty || cityControl?.touched)) {
                      <div class="form-error">City is required.</div>
                    }
                  </div>

                  <div class="form-group">
                    <label for="venue-state" class="form-label required">State / Province</label>
                    <input
                      id="venue-state"
                      type="text"
                      formControlName="state"
                      class="form-control"
                      [class.is-invalid]="stateControl?.invalid && (stateControl?.dirty || stateControl?.touched)"
                      placeholder="e.g., IL"
                      maxlength="100"
                    />
                    @if (stateControl?.invalid && (stateControl?.dirty || stateControl?.touched)) {
                      <div class="form-error">State is required.</div>
                    }
                  </div>
                </div>

                <div class="form-row-grid">
                  <div class="form-group">
                    <label for="venue-country" class="form-label required">Country</label>
                    <input
                      id="venue-country"
                      type="text"
                      formControlName="country"
                      class="form-control"
                      [class.is-invalid]="countryControl?.invalid && (countryControl?.dirty || countryControl?.touched)"
                      placeholder="e.g., USA"
                      maxlength="100"
                    />
                    @if (countryControl?.invalid && (countryControl?.dirty || countryControl?.touched)) {
                      <div class="form-error">Country is required.</div>
                    }
                  </div>

                  <div class="form-group">
                    <label for="venue-postal-code" class="form-label">Postal Code</label>
                    <input
                      id="venue-postal-code"
                      type="text"
                      formControlName="postalCode"
                      class="form-control"
                      [class.is-invalid]="postalCodeControl?.invalid && (postalCodeControl?.dirty || postalCodeControl?.touched)"
                      placeholder="e.g., 60601"
                      maxlength="20"
                    />
                    @if (postalCodeControl?.errors?.['maxlength']) {
                      <div class="form-error">Postal code cannot exceed 20 characters.</div>
                    }
                  </div>
                </div>

                <!-- Capacity & Contact Row -->
                <div class="form-row-grid">
                  <div class="form-group">
                    <label for="venue-capacity" class="form-label required">Capacity</label>
                    <input
                      id="venue-capacity"
                      type="number"
                      formControlName="capacity"
                      class="form-control"
                      [class.is-invalid]="capacityControl?.invalid && (capacityControl?.dirty || capacityControl?.touched)"
                      placeholder="e.g., 500"
                      min="1"
                    />
                    @if (capacityControl?.invalid && (capacityControl?.dirty || capacityControl?.touched)) {
                      <div class="form-error">
                        @if (capacityControl?.errors?.['required']) {
                          Capacity is required.
                        }
                        @if (capacityControl?.errors?.['min']) {
                          Capacity must be greater than 0.
                        }
                      </div>
                    }
                  </div>

                  <div class="form-group">
                    <label for="venue-contact-person" class="form-label">Contact Person</label>
                    <input
                      id="venue-contact-person"
                      type="text"
                      formControlName="contactPerson"
                      class="form-control"
                      placeholder="e.g., Jane Doe"
                      maxlength="100"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="venue-contact-number" class="form-label">Contact Number</label>
                  <input
                    id="venue-contact-number"
                    type="text"
                    formControlName="contactNumber"
                    class="form-control"
                    placeholder="e.g., +1 (312) 555-0199"
                    maxlength="25"
                  />
                </div>

                <!-- Active Status Checkbox -->
                <div class="form-group checkbox-group">
                  <label class="checkbox-label" for="venue-is-active">
                    <input
                      id="venue-is-active"
                      type="checkbox"
                      formControlName="isActive"
                      class="checkbox-input"
                    />
                    <div class="checkbox-text">
                      <span class="checkbox-title">Active Venue</span>
                      <span class="checkbox-desc">Active venues are available for selection when organizers create events.</span>
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
                  [disabled]="venueForm.invalid || saving()"
                >
                  @if (saving()) {
                    <span class="spinner-sm" aria-hidden="true"></span>
                    <span>Saving...</span>
                  } @else {
                    <span>{{ modalMode() === 'create' ? 'Create Venue' : 'Save Changes' }}</span>
                  }
                </button>
              </footer>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (isDeleteModalOpen() && venueToDelete()) {
        <div class="modal-backdrop" (click)="onDeleteBackdropClick($event)">
          <div
            class="modal-dialog modal-dialog-sm"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'delete-modal-title'"
          >
            <header class="modal-header modal-header-danger">
              <h2 id="delete-modal-title" class="modal-title text-danger">
                Delete Venue
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
                Are you sure you want to delete venue
                <strong>"{{ venueToDelete()?.name }}"</strong> ({{ venueToDelete()?.city }})?
              </p>
              <p class="delete-subtext">
                This action is permanent and cannot be undone. Venues with associated events cannot be deleted.
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
                  <span>Delete Venue</span>
                }
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .venue-admin-container {
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
      min-width: 240px;
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

    .page-size-control {
      flex: 0 0 90px;
      min-width: 80px;
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

    /* Table Styles */
    .table-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .venue-name-cell {
      font-weight: var(--font-weight-medium);
    }

    .venue-name-wrapper {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
    }

    .venue-icon {
      font-size: 1.25rem;
      line-height: 1.2;
    }

    .venue-name-text {
      color: var(--color-gray-900);
      font-weight: var(--font-weight-semibold);
    }

    .venue-created-subtext {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
      font-weight: var(--font-weight-normal);
    }

    .venue-location-cell {
      line-height: 1.4;
    }

    .location-address {
      color: var(--color-gray-800);
    }

    .location-city-state {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .capacity-pill {
      display: inline-block;
      padding: var(--space-1) var(--space-2);
      background-color: var(--color-primary-50);
      color: var(--color-primary-700);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
    }

    .venue-contact-cell {
      font-size: var(--font-size-xs);
      line-height: 1.4;
    }

    .contact-person {
      color: var(--color-gray-800);
      font-weight: var(--font-weight-medium);
    }

    .contact-number {
      color: var(--color-gray-500);
    }

    .text-muted {
      color: var(--color-gray-400);
    }

    .italic {
      font-style: italic;
    }

    .venue-actions-cell {
      text-align: right;
      white-space: nowrap;
    }

    .action-buttons {
      display: inline-flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    /* Badges */
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

    .modal-dialog-lg {
      max-width: 620px;
    }

    .modal-dialog-sm {
      max-width: 440px;
      text-align: center;
    }

    .modal-scrollable {
      max-height: 75vh;
      overflow-y: auto;
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

    .form-row-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    @media (max-width: 540px) {
      .form-row-grid {
        grid-template-columns: 1fr;
      }
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
export class VenueManagementComponent implements OnInit {
  private readonly venueService = inject(VenueService);
  private readonly feedbackService = inject(UiFeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // Venue State
  readonly venues = signal<VenueDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  // Filter & Search State
  readonly searchQuery = signal<string>('');
  readonly cityFilter = signal<string>('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly sortBy = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Async Lifecycle State
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Modal State for Create & Edit
  readonly isCreateEditModalOpen = signal<boolean>(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly selectedVenueId = signal<string | null>(null);
  readonly saving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  // Modal State for Delete
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly venueToDelete = signal<VenueDto | null>(null);
  readonly deleting = signal<boolean>(false);
  readonly deleteError = signal<string | null>(null);

  venueForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', [Validators.required, Validators.maxLength(250)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    postalCode: ['', [Validators.maxLength(20)]],
    capacity: [null, [Validators.required, Validators.min(1)]],
    contactPerson: ['', [Validators.maxLength(100)]],
    contactNumber: ['', [Validators.maxLength(25)]],
    isActive: [true],
  });

  get nameControl() { return this.venueForm.get('name'); }
  get addressControl() { return this.venueForm.get('address'); }
  get cityControl() { return this.venueForm.get('city'); }
  get stateControl() { return this.venueForm.get('state'); }
  get countryControl() { return this.venueForm.get('country'); }
  get postalCodeControl() { return this.venueForm.get('postalCode'); }
  get capacityControl() { return this.venueForm.get('capacity'); }

  ngOnInit(): void {
    if (this.route) {
      const snapshotParams = this.route.snapshot.queryParamMap;
      this.applyQueryParams(snapshotParams);

      this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        if (this.hasParamsChanged(params)) {
          this.applyQueryParams(params);
          this.loadVenues();
        }
      });
    }

    this.loadVenues();
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const city = params.get('city') || '';
    const statusParam = params.get('status');
    const status: 'all' | 'active' | 'inactive' =
      statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
    const sort = params.get('sortBy') || 'name';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

    this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 10 : size);
    this.searchQuery.set(search);
    this.cityFilter.set(city);
    this.statusFilter.set(status);
    this.sortBy.set(sort);
    this.sortDirection.set(dir);
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const city = params.get('city') || '';
    const statusParam = params.get('status');
    const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
    const sort = params.get('sortBy') || 'name';
    const dir = params.get('sortDir') === 'desc' ? 'desc' : 'asc';

    return (
      page !== this.pageNumber() ||
      size !== this.pageSize() ||
      search !== this.searchQuery() ||
      city !== this.cityFilter() ||
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
      city: this.cityFilter().trim() || null,
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

  loadVenues(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: VenueQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    if (this.searchQuery().trim()) {
      query.search = this.searchQuery().trim();
    }

    if (this.cityFilter().trim()) {
      query.city = this.cityFilter().trim();
    }

    if (this.statusFilter() === 'active') {
      query.isActive = true;
    } else if (this.statusFilter() === 'inactive') {
      query.isActive = false;
    }

    this.venueService.getAll(query).subscribe({
      next: (result) => {
        this.venues.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to retrieve venues.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadVenues();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.onSearchChange(value);
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  onCityFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.cityFilter.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadVenues();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive';
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadVenues();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadVenues();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadVenues();
  }

  onPageSizeChange(event: Event | number): void {
    const size = typeof event === 'number' ? event : parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadVenues();
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadVenues();
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.cityFilter.set('');
    this.statusFilter.set('all');
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadVenues();
  }

  // Create & Edit Modal Actions
  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedVenueId.set(null);
    this.modalError.set(null);
    this.venueForm.reset({
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'USA',
      postalCode: '',
      capacity: null,
      contactPerson: '',
      contactNumber: '',
      isActive: true,
    });
    this.isCreateEditModalOpen.set(true);
  }

  openEditModal(venue: VenueDto): void {
    this.modalMode.set('edit');
    this.selectedVenueId.set(venue.id);
    this.modalError.set(null);
    this.venueForm.reset({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      postalCode: venue.postalCode || '',
      capacity: venue.capacity,
      contactPerson: venue.contactPerson || '',
      contactNumber: venue.contactNumber || '',
      isActive: venue.isActive,
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

  submitVenueForm(): void {
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      return;
    }

    const rawValue = this.venueForm.value;
    this.saving.set(true);
    this.modalError.set(null);

    if (this.modalMode() === 'create') {
      const createDto: CreateVenueDto = {
        name: rawValue.name.trim(),
        address: rawValue.address.trim(),
        city: rawValue.city.trim(),
        state: rawValue.state.trim(),
        country: rawValue.country.trim(),
        postalCode: rawValue.postalCode?.trim() || null,
        capacity: Number(rawValue.capacity),
        contactPerson: rawValue.contactPerson?.trim() || null,
        contactNumber: rawValue.contactNumber?.trim() || null,
        isActive: !!rawValue.isActive,
      };

      this.venueService.create(createDto).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.closeCreateEditModal();
          this.feedbackService.showSuccess(`Venue "${created.name}" created successfully.`);
          this.loadVenues();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.modalError.set(err.message || 'Failed to create venue.');
        },
      });
    } else {
      const id = this.selectedVenueId();
      if (!id) return;

      const updateDto: UpdateVenueDto = {
        name: rawValue.name.trim(),
        address: rawValue.address.trim(),
        city: rawValue.city.trim(),
        state: rawValue.state.trim(),
        country: rawValue.country.trim(),
        postalCode: rawValue.postalCode?.trim() || null,
        capacity: Number(rawValue.capacity),
        contactPerson: rawValue.contactPerson?.trim() || null,
        contactNumber: rawValue.contactNumber?.trim() || null,
        isActive: !!rawValue.isActive,
      };

      this.venueService.update(id, updateDto).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.closeCreateEditModal();
          this.feedbackService.showSuccess(`Venue "${updated.name}" updated successfully.`);
          this.loadVenues();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.modalError.set(err.message || 'Failed to update venue.');
        },
      });
    }
  }

  // Delete Modal Actions
  openDeleteModal(venue: VenueDto): void {
    this.venueToDelete.set(venue);
    this.deleteError.set(null);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.venueToDelete.set(null);
    this.deleteError.set(null);
  }

  onDeleteBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop') && !this.deleting()) {
      this.closeDeleteModal();
    }
  }

  confirmDelete(): void {
    const venue = this.venueToDelete();
    if (!venue) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.venueService.delete(venue.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.feedbackService.showSuccess(`Venue "${venue.name}" deleted successfully.`);
        if (this.venues().length === 1 && this.pageNumber() > 1) {
          this.pageNumber.update((p) => p - 1);
        }
        this.loadVenues();
      },
      error: (err: ApiError) => {
        this.deleting.set(false);
        this.deleteError.set(err.message || 'Failed to delete venue.');
      },
    });
  }
}
