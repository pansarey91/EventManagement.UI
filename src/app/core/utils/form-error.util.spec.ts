import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormErrorUtil } from './form-error.util';
import { ApiError } from '../models';

describe('FormErrorUtil', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      maxCapacity: new FormControl(0, [Validators.min(1)]),
    });
  });

  describe('applyBackendValidationErrors', () => {
    it('should map errors case-insensitively onto matching form controls', () => {
      const apiError: ApiError = {
        statusCode: 400,
        message: 'Validation failed',
        errors: {
          Name: ['Name is required and must be unique.'],
          MaxCapacity: ['Capacity must be at least 1.'],
        },
      };

      const unmapped = FormErrorUtil.applyBackendValidationErrors(form, apiError);

      expect(unmapped.length).toBe(0);
      expect(form.get('name')?.hasError('serverError')).toBe(true);
      expect(form.get('name')?.getError('serverError')).toBe('Name is required and must be unique.');
      expect(form.get('name')?.touched).toBe(true);

      expect(form.get('maxCapacity')?.hasError('serverError')).toBe(true);
      expect(form.get('maxCapacity')?.getError('serverError')).toBe('Capacity must be at least 1.');
    });

    it('should return unmapped errors when keys do not match any control', () => {
      const apiError: ApiError = {
        statusCode: 400,
        message: 'Validation failed',
        errors: {
          GlobalRule: ['The overall event schedule is invalid.'],
        },
      };

      const unmapped = FormErrorUtil.applyBackendValidationErrors(form, apiError);

      expect(unmapped.length).toBe(1);
      expect(unmapped[0]).toContain('The overall event schedule is invalid.');
    });

    it('should return error.message as unmapped if errors dictionary is empty', () => {
      const apiError: ApiError = {
        statusCode: 400,
        message: 'Invalid request payload format.',
      };

      const unmapped = FormErrorUtil.applyBackendValidationErrors(form, apiError);

      expect(unmapped).toEqual(['Invalid request payload format.']);
    });
  });

  describe('clearServerErrors', () => {
    it('should remove serverError without affecting other client validators', () => {
      const nameControl = form.get('name')!;
      nameControl.setErrors({ required: true, serverError: 'Server rejected' });

      FormErrorUtil.clearServerErrors(form);

      expect(nameControl.hasError('serverError')).toBe(false);
      expect(nameControl.hasError('required')).toBe(true);
    });
  });

  describe('getControlErrorMessage', () => {
    it('should prioritize serverError when present', () => {
      const control = form.get('name')!;
      control.setErrors({ required: true, serverError: 'Custom server error' });
      control.markAsTouched();

      const message = FormErrorUtil.getControlErrorMessage(control, 'Title');
      expect(message).toBe('Custom server error');
    });

    it('should format standard client validators when touched', () => {
      const emailControl = form.get('email')!;
      emailControl.setValue('invalid-email');
      emailControl.markAsTouched();

      const message = FormErrorUtil.getControlErrorMessage(emailControl, 'Email');
      expect(message).toBe('Please enter a valid email address.');
    });

    it('should return null when control is untouched or valid', () => {
      const control = form.get('name')!;
      expect(FormErrorUtil.getControlErrorMessage(control)).toBeNull();

      control.setValue('Valid Event Name');
      control.markAsTouched();
      expect(FormErrorUtil.getControlErrorMessage(control)).toBeNull();
    });
  });
});
