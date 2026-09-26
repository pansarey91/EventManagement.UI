import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from '../models';

/**
 * Utility functions for mapping backend validation errors to Angular Reactive Forms.
 */
export class FormErrorUtil {
  /**
   * Applies backend validation errors from an ApiError payload directly onto matching
   * Angular form controls (case-insensitively). Returns any unmapped errors for form-level banner display.
   */
  static applyBackendValidationErrors(form: FormGroup, apiError: ApiError): string[] {
    const unmapped: string[] = [];

    if (!apiError.errors || Object.keys(apiError.errors).length === 0) {
      if (apiError.message) {
        unmapped.push(apiError.message);
      }
      return unmapped;
    }

    const formControlKeys = Object.keys(form.controls);

    for (const [key, messages] of Object.entries(apiError.errors)) {
      const errorText = Array.isArray(messages) ? messages.join(' ') : String(messages);

      // Find matching form control name case-insensitively
      const matchedKey = formControlKeys.find(
        (cKey) => cKey.toLowerCase() === key.toLowerCase()
      );

      if (matchedKey) {
        const control = form.get(matchedKey);
        if (control) {
          const currentErrors = control.errors || {};
          control.setErrors({
            ...currentErrors,
            serverError: errorText,
          });
          control.markAsTouched();
        }
      } else {
        unmapped.push(`${key}: ${errorText}`);
      }
    }

    return unmapped;
  }

  /**
   * Clears existing serverError validation flags across all controls of a FormGroup
   * prior to re-submission.
   */
  static clearServerErrors(form: FormGroup): void {
    Object.values(form.controls).forEach((control) => {
      if (control.errors && control.errors['serverError']) {
        const { serverError, ...otherErrors } = control.errors;
        const remaining = Object.keys(otherErrors).length > 0 ? otherErrors : null;
        control.setErrors(remaining);
      }
    });
  }

  /**
   * Returns a user-friendly error message for an AbstractControl based on active validation errors.
   */
  static getControlErrorMessage(
    control: AbstractControl | null,
    fieldDisplayName = 'This field'
  ): string | null {
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    const errors = control.errors;

    if (errors['serverError']) {
      return errors['serverError'];
    }

    if (errors['required']) {
      return `${fieldDisplayName} is required.`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (errors['minlength']) {
      return `${fieldDisplayName} must be at least ${errors['minlength'].requiredLength} characters.`;
    }

    if (errors['maxlength']) {
      return `${fieldDisplayName} cannot exceed ${errors['maxlength'].requiredLength} characters.`;
    }

    if (errors['min']) {
      return `${fieldDisplayName} must be at least ${errors['min'].min}.`;
    }

    if (errors['max']) {
      return `${fieldDisplayName} cannot exceed ${errors['max'].max}.`;
    }

    if (errors['pattern']) {
      return `${fieldDisplayName} format is invalid.`;
    }

    return 'Please enter a valid value.';
  }
}
