import { Component, ElementRef, ViewChild, effect, input, output, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { debounce, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-input-wrapper">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input
        #inputElement
        type="search"
        class="form-control search-input"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        [attr.aria-label]="ariaLabel()"
      />
      @if (inputElement.value) {
        <button
          type="button"
          class="clear-btn"
          (click)="clear()"
          aria-label="Clear search input"
          title="Clear search"
        >
          ✕
        </button>
      }
    </div>
  `,
  styles: [`
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      font-size: 0.875rem;
      color: var(--color-gray-400);
      pointer-events: none;
      user-select: none;
    }

    .search-input {
      width: 100%;
      padding-left: 2.25rem;
      padding-right: 2.25rem;
      height: 2.5rem;
      font-size: var(--font-size-sm);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: #ffffff;
      color: var(--color-gray-900);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    /* Remove native webkit clear buttons to use consistent cross-browser custom clear */
    .search-input::-webkit-search-cancel-button {
      -webkit-appearance: none;
    }

    .clear-btn {
      position: absolute;
      right: var(--space-3);
      background: transparent;
      border: none;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: var(--space-1);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      line-height: 1;
      transition: color 0.15s ease;
    }

    .clear-btn:hover {
      color: var(--color-gray-700);
    }
  `],
})
export class SearchInputComponent {
  @ViewChild('inputElement') inputRef?: ElementRef<HTMLInputElement>;

  readonly value = input<string>('');
  readonly placeholder = input<string>('Search...');
  readonly debounceMs = input<number>(300);
  readonly ariaLabel = input<string>('Search');

  readonly searchChange = output<string>();

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        takeUntilDestroyed(),
        debounce(() => timer(this.debounceMs())),
        distinctUntilChanged()
      )
      .subscribe((term) => {
        this.searchChange.emit(term);
      });

    effect(() => {
      const incomingVal = this.value();
      untracked(() => {
        if (this.inputRef && this.inputRef.nativeElement.value !== incomingVal) {
          this.inputRef.nativeElement.value = incomingVal;
        }
      });
    });
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  clear(): void {
    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
    }
    this.searchChange.emit('');
  }
}
