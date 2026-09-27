import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { CategoryService } from '../../core/services/category.service';
import { VenueService } from '../../core/services/venue.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  EventCategoryDto,
  VenueDto,
  CreateEventDto,
  UpdateEventDto,
  EventDto,
  ApiError,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { FormErrorUtil } from '../../core/utils/form-error.util';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LoadingSpinnerComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="event-form-container">
      <nav aria-label="Breadcrumb" class="form-nav">
        <a routerLink="/organizer/events" class="back-link">
          <span aria-hidden="true">←</span> Back to Manage Events
        </a>
      </nav>

      <header class="page-header">
        <h1 class="page-title">{{ isEditMode() ? 'Edit Event' : 'Create New Event' }}</h1>
        <p class="page-subtitle">
          {{ isEditMode() ? 'Update event schedule, venue location, or attendee capacity.' : 'Configure your event details, location, schedule, and capacity limit.' }}
        </p>
      </header>

      @if (initialLoading()) {
        <div class="loading-wrapper">
          <app-loading-spinner [message]="'Loading event details...'"></app-loading-spinner>
        </div>
      } @else if (loadError()) {
        <app-error-state
          [title]="'Unable to Load Event'"
          [message]="loadError()!"
          (retry)="loadInitialData()"
        ></app-error-state>
      } @else {
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" class="event-form card" novalidate>
          <div class="card-body form-grid">
            <!-- Global Server Error Alert -->
            @if (serverError()) {
              <div class="alert alert-danger" role="alert">
                {{ serverError() }}
              </div>
            }

            <!-- 1. Event Core Details -->
            <fieldset class="form-section">
              <legend class="section-legend">1. Event Basics</legend>

              <!-- Event Name -->
              <div class="form-group">
                <label for="name" class="form-label required">Event Title</label>
                <input
                  id="name"
                  type="text"
                  class="form-control"
                  formControlName="name"
                  placeholder="e.g. Global Tech Summit 2026"
                  [class.is-invalid]="hasError('name')"
                />
                @if (hasError('name', 'required')) {
                  <span class="error-msg">Event title is required.</span>
                }
                @if (hasError('name', 'minlength')) {
                  <span class="error-msg">Title must be at least 3 characters.</span>
                }
                @if (hasError('name', 'maxlength')) {
                  <span class="error-msg">Title cannot exceed 200 characters.</span>
                }
                @if (hasError('name', 'serverError')) {
                  <span class="error-msg">{{ getFieldError('name') }}</span>
                }
              </div>

              <!-- Category Select -->
              <div class="form-group">
                <label for="categoryId" class="form-label required">Event Category</label>
                <select
                  id="categoryId"
                  class="form-select"
                  formControlName="categoryId"
                  [class.is-invalid]="hasError('categoryId')"
                >
                  <option value="">Select a category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (hasError('categoryId', 'required')) {
                  <span class="error-msg">Please select an event category.</span>
                }
                @if (hasError('categoryId', 'serverError')) {
                  <span class="error-msg">{{ getFieldError('categoryId') }}</span>
                }
              </div>

              <!-- Description -->
              <div class="form-group">
                <label for="description" class="form-label">Event Description</label>
                <textarea
                  id="description"
                  class="form-control"
                  formControlName="description"
                  rows="4"
                  placeholder="Provide an engaging description of what attendees can expect..."
                  [class.is-invalid]="hasError('description')"
                ></textarea>
                @if (hasError('description', 'maxlength')) {
                  <span class="error-msg">Description cannot exceed 2000 characters.</span>
                }
              </div>

              <!-- Banner Image URL -->
              <div class="form-group">
                <label for="bannerImageUrl" class="form-label">Banner Image URL</label>
                <input
                  id="bannerImageUrl"
                  type="url"
                  class="form-control"
                  formControlName="bannerImageUrl"
                  placeholder="https://example.com/banner.jpg"
                  [class.is-invalid]="hasError('bannerImageUrl')"
                />
                <span class="form-hint">Optional. Provide an HTTPS link to a promotional banner image.</span>
              </div>
            </fieldset>

            <!-- 2. Location & Capacity -->
            <fieldset class="form-section">
              <legend class="section-legend">2. Venue & Attendance Limit</legend>

              <!-- Venue Select -->
              <div class="form-group">
                <label for="venueId" class="form-label required">Venue</label>
                <select
                  id="venueId"
                  class="form-select"
                  formControlName="venueId"
                  [class.is-invalid]="hasError('venueId')"
                >
                  <option value="">Select a venue</option>
                  @for (v of venues(); track v.id) {
                    <option [value]="v.id">
                      {{ v.name }} ({{ v.city }}) — Max Capacity: {{ v.capacity }}
                    </option>
                  }
                </select>
                @if (hasError('venueId', 'required')) {
                  <span class="error-msg">Please select a venue.</span>
                }
                @if (selectedVenue()) {
                  <span class="form-hint venue-info-hint">
                    🏛️ {{ selectedVenue()!.name }} can accommodate up to <strong>{{ selectedVenue()!.capacity }}</strong> guests.
                  </span>
                }
              </div>

              <!-- Maximum Capacity -->
              <div class="form-group">
                <label for="maxCapacity" class="form-label required">Maximum Event Capacity</label>
                <input
                  id="maxCapacity"
                  type="number"
                  class="form-control"
                  formControlName="maxCapacity"
                  placeholder="e.g. 250"
                  min="1"
                  [class.is-invalid]="hasError('maxCapacity') || eventForm.errors?.['capacityExceedsVenue']"
                />
                @if (hasError('maxCapacity', 'required')) {
                  <span class="error-msg">Capacity is required.</span>
                }
                @if (hasError('maxCapacity', 'min')) {
                  <span class="error-msg">Capacity must be at least 1.</span>
                }
                @if (eventForm.errors?.['capacityExceedsVenue']) {
                  <span class="error-msg">
                    Event capacity cannot exceed venue capacity ({{ eventForm.errors?.['capacityExceedsVenue'].venueCapacity }} max).
                  </span>
                }
                @if (hasError('maxCapacity', 'serverError')) {
                  <span class="error-msg">{{ getFieldError('maxCapacity') }}</span>
                }
              </div>
            </fieldset>

            <!-- 3. Scheduling & Dates -->
            <fieldset class="form-section">
              <legend class="section-legend">3. Scheduling & Registration Timeline</legend>

              <div class="date-fields-grid">
                <!-- Start Date Time -->
                <div class="form-group">
                  <label for="startDateTime" class="form-label required">Start Date & Time</label>
                  <input
                    id="startDateTime"
                    type="datetime-local"
                    class="form-control"
                    formControlName="startDateTime"
                    [class.is-invalid]="hasError('startDateTime')"
                  />
                  @if (hasError('startDateTime', 'required')) {
                    <span class="error-msg">Start date and time is required.</span>
                  }
                </div>

                <!-- End Date Time -->
                <div class="form-group">
                  <label for="endDateTime" class="form-label required">End Date & Time</label>
                  <input
                    id="endDateTime"
                    type="datetime-local"
                    class="form-control"
                    formControlName="endDateTime"
                    [class.is-invalid]="hasError('endDateTime') || eventForm.errors?.['endBeforeStart']"
                  />
                  @if (hasError('endDateTime', 'required')) {
                    <span class="error-msg">End date and time is required.</span>
                  }
                  @if (eventForm.errors?.['endBeforeStart']) {
                    <span class="error-msg">End time must be later than start time.</span>
                  }
                </div>
              </div>

              <!-- Registration Deadline -->
              <div class="form-group">
                <label for="registrationDeadline" class="form-label">Registration Deadline</label>
                <input
                  id="registrationDeadline"
                  type="datetime-local"
                  class="form-control"
                  formControlName="registrationDeadline"
                  [class.is-invalid]="eventForm.errors?.['deadlineAfterStart']"
                />
                <span class="form-hint">Optional. Attendees cannot register after this deadline. Must be on or before start time.</span>
                @if (eventForm.errors?.['deadlineAfterStart']) {
                  <span class="error-msg">Registration deadline cannot be later than event start date & time.</span>
                }
              </div>
            </fieldset>
          </div>

          <!-- Form Actions Footer -->
          <footer class="card-footer form-actions">
            <a routerLink="/organizer/events" class="btn btn-secondary" [class.disabled]="submitting()">
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary btn-submit"
              [disabled]="submitting() || (eventForm.touched && eventForm.invalid)"
            >
              @if (submitting()) {
                <span>Saving Event...</span>
              } @else {
                <span>{{ isEditMode() ? 'Save Changes' : 'Create Event' }}</span>
              }
            </button>
          </footer>
        </form>
      }
    </div>
  `,
  styles: [`
    .event-form-container {
      width: 100%;
      max-width: 840px;
      margin: 0 auto;
      padding: var(--space-4) 0 var(--space-12);
    }

    .form-nav {
      margin-bottom: var(--space-4);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary-600);
      text-decoration: none;
    }

    .back-link:hover {
      text-decoration: underline;
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

    .event-form {
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
      padding: var(--space-8);
    }

    .form-section {
      border: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .section-legend {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      padding-bottom: var(--space-2);
      border-bottom: 2px solid var(--color-gray-100);
      width: 100%;
      margin-bottom: var(--space-2);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .form-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-800);
    }

    .form-label.required::after {
      content: ' *';
      color: var(--color-danger-text);
    }

    .form-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .venue-info-hint {
      color: var(--color-primary-700);
      background-color: var(--color-primary-50);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      display: inline-block;
      margin-top: var(--space-1);
    }

    .error-msg {
      font-size: var(--font-size-xs);
      color: var(--color-danger-text);
      margin-top: 0.125rem;
    }

    .is-invalid {
      border-color: var(--color-danger-border) !important;
    }

    .date-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    @media (max-width: 600px) {
      .date-fields-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-8);
      background-color: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
    }

    .btn-submit {
      min-width: 140px;
    }

    .disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    .loading-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }
  `],
})
export class EventCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly categoryService = inject(CategoryService);
  private readonly venueService = inject(VenueService);
  private readonly uiFeedback = inject(UiFeedbackService);

  readonly eventId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.eventId());

  readonly categories = signal<EventCategoryDto[]>([]);
  readonly venues = signal<VenueDto[]>([]);

  readonly initialLoading = signal<boolean>(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly serverError = signal<string | null>(null);

  readonly existingEvent = signal<EventDto | null>(null);

  readonly selectedVenue = computed(() => {
    const venueId = this.eventForm?.get('venueId')?.value;
    if (!venueId) return null;
    return this.venues().find((v) => v.id === venueId) || null;
  });

  eventForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(id);
    }
    this.loadInitialData();
  }

  initForm(): void {
    this.eventForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        description: ['', [Validators.maxLength(2000)]],
        categoryId: ['', [Validators.required]],
        venueId: ['', [Validators.required]],
        startDateTime: ['', [Validators.required]],
        endDateTime: ['', [Validators.required]],
        registrationDeadline: [''],
        maxCapacity: [100, [Validators.required, Validators.min(1)]],
        bannerImageUrl: ['', [Validators.maxLength(500)]],
      },
      {
        validators: [this.validateDatesAndCapacity.bind(this)],
      }
    );

    // Trigger revalidation when venueId changes to update capacity check
    this.eventForm.get('venueId')?.valueChanges.subscribe(() => {
      this.eventForm.updateValueAndValidity({ onlySelf: true });
    });
  }

  loadInitialData(): void {
    this.initialLoading.set(true);
    this.loadError.set(null);

    // Fetch categories and venues concurrently
    this.categoryService.getAll({ pageSize: 100, isActive: true }).subscribe({
      next: (catRes) => {
        this.categories.set(catRes.items);

        this.venueService.getAll({ pageSize: 100, isActive: true }).subscribe({
          next: (venueRes) => {
            this.venues.set(venueRes.items);

            if (this.isEditMode()) {
              this.loadEventForEditing(this.eventId()!);
            } else {
              this.initialLoading.set(false);
            }
          },
          error: (err: ApiError) => {
            this.loadError.set(err.message || 'Failed to load venues.');
            this.initialLoading.set(false);
          },
        });
      },
      error: (err: ApiError) => {
        this.loadError.set(err.message || 'Failed to load categories.');
        this.initialLoading.set(false);
      },
    });
  }

  loadEventForEditing(id: string): void {
    this.eventService.getById(id).subscribe({
      next: (ev) => {
        this.existingEvent.set(ev);
        this.eventForm.patchValue({
          name: ev.name,
          description: ev.description || '',
          categoryId: ev.categoryId,
          venueId: ev.venueId,
          startDateTime: this.toDatetimeLocal(ev.startDateTime),
          endDateTime: this.toDatetimeLocal(ev.endDateTime),
          registrationDeadline: this.toDatetimeLocal(ev.registrationDeadline),
          maxCapacity: ev.maxCapacity,
          bannerImageUrl: ev.bannerImageUrl || '',
        });
        this.initialLoading.set(false);
      },
      error: (err: ApiError) => {
        this.loadError.set(err.message || 'Failed to load event details.');
        this.initialLoading.set(false);
      },
    });
  }

  validateDatesAndCapacity(control: AbstractControl): ValidationErrors | null {
    const startVal = control.get('startDateTime')?.value;
    const endVal = control.get('endDateTime')?.value;
    const deadlineVal = control.get('registrationDeadline')?.value;
    const maxCapacity = control.get('maxCapacity')?.value;
    const venueId = control.get('venueId')?.value;

    const errors: ValidationErrors = {};

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startVal && endVal) {
      startDate = new Date(startVal);
      endDate = new Date(endVal);

      if (endDate <= startDate) {
        errors['endBeforeStart'] = true;
      }
    }

    if (startVal && deadlineVal) {
      const deadlineDate = new Date(deadlineVal);
      if (!startDate) startDate = new Date(startVal);

      if (deadlineDate > startDate) {
        errors['deadlineAfterStart'] = true;
      }
    }

    if (venueId && maxCapacity) {
      const venue = this.venues().find((v) => v.id === venueId);
      if (venue && maxCapacity > venue.capacity) {
        errors['capacityExceedsVenue'] = { venueCapacity: venue.capacity };
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  hasError(field: string, errorKey?: string): boolean {
    const ctrl = this.eventForm.get(field);
    if (!ctrl) return false;
    if (errorKey) {
      return ctrl.hasError(errorKey) && (ctrl.dirty || ctrl.touched);
    }
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  getFieldError(field: string): string | null {
    const ctrl = this.eventForm.get(field);
    return FormErrorUtil.getControlErrorMessage(ctrl);
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    FormErrorUtil.clearServerErrors(this.eventForm);
    this.submitting.set(true);
    this.serverError.set(null);

    const formValues = this.eventForm.value;

    const startIso = this.formatDateForApi(formValues.startDateTime)!;
    const endIso = this.formatDateForApi(formValues.endDateTime)!;
    const deadlineIso = this.formatDateForApi(formValues.registrationDeadline);

    if (this.isEditMode()) {
      const updateDto: UpdateEventDto = {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || null,
        categoryId: formValues.categoryId,
        venueId: formValues.venueId,
        startDateTime: startIso,
        endDateTime: endIso,
        registrationDeadline: deadlineIso,
        maxCapacity: Number(formValues.maxCapacity),
        bannerImageUrl: formValues.bannerImageUrl?.trim() || null,
      };

      this.eventService.update(this.eventId()!, updateDto).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.uiFeedback.showSuccess(`Event "${res.name}" updated successfully!`);
          this.router.navigate(['/organizer/events']);
        },
        error: (err: ApiError) => {
          this.submitting.set(false);
          const unmapped = FormErrorUtil.applyBackendValidationErrors(this.eventForm, err);
          if (unmapped.length > 0) {
            this.serverError.set(unmapped.join(' | '));
          }
        },
      });
    } else {
      const createDto: CreateEventDto = {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || null,
        categoryId: formValues.categoryId,
        venueId: formValues.venueId,
        startDateTime: startIso,
        endDateTime: endIso,
        registrationDeadline: deadlineIso,
        maxCapacity: Number(formValues.maxCapacity),
        bannerImageUrl: formValues.bannerImageUrl?.trim() || null,
      };

      this.eventService.create(createDto).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.uiFeedback.showSuccess(`Event "${res.name}" created successfully in Draft status!`);
          this.router.navigate(['/organizer/events']);
        },
        error: (err: ApiError) => {
          this.submitting.set(false);
          const unmapped = FormErrorUtil.applyBackendValidationErrors(this.eventForm, err);
          if (unmapped.length > 0) {
            this.serverError.set(unmapped.join(' | '));
          }
        },
      });
    }
  }

  private formatDateForApi(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    // Keep local datetime without timezone conversion so event times remain wall-clock local
    if (trimmed.length === 16 && trimmed.includes('T')) {
      return `${trimmed}:00`;
    }
    return trimmed;
  }

  private toDatetimeLocal(isoString?: string | null): string {
    if (!isoString) return '';
    if (isoString.includes('T') && !isoString.endsWith('Z') && !isoString.includes('+')) {
      return isoString.substring(0, 16);
    }
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}

