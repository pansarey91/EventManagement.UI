import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrendDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trend-chart-card card">
      <div class="chart-header">
        <div class="chart-title-wrap">
          <h3 class="chart-title">{{ title() }}</h3>
          <span class="chart-subtitle">{{ data().length }} data points in selected period</span>
        </div>
        <div class="chart-header-actions">
          <button
            type="button"
            class="btn btn-xs btn-outline"
            (click)="toggleTableView()"
            [attr.aria-expanded]="showTable()"
            aria-label="Toggle tabular data view"
          >
            {{ showTable() ? '📊 View Chart' : '📋 View Table' }}
          </button>
        </div>
      </div>

      @if (data().length === 0) {
        <div class="chart-empty-state">
          <span class="empty-icon" aria-hidden="true">📈</span>
          <p>No activity recorded in the selected date range.</p>
        </div>
      } @else if (showTable()) {
        <!-- Accessible Data Table for Screen Readers & Keyboard Users -->
        <div class="table-responsive chart-table-wrap">
          <table class="chart-table" [attr.aria-label]="title() + ' data table'">
            <thead>
              <tr>
                <th>Date / Period</th>
                <th class="text-right">{{ primaryLabel() }}</th>
                @if (secondaryLabel()) {
                  <th class="text-right">{{ secondaryLabel() }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (item of data(); track item.label) {
                <tr>
                  <td>{{ item.label }}</td>
                  <td class="text-right font-medium">
                    {{ valuePrefix() }}{{ item.value | number:'1.0-2' }}{{ valueSuffix() }}
                  </td>
                  @if (secondaryLabel()) {
                    <td class="text-right text-muted">
                      {{ valuePrefix() }}{{ (item.secondaryValue || 0) | number:'1.0-2' }}{{ valueSuffix() }}
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <!-- Interactive Accessible SVG Chart -->
        <div class="svg-container" role="img" [attr.aria-label]="title() + ' graphical chart'">
          <svg viewBox="0 0 600 220" class="chart-svg" preserveAspectRatio="none">
            <!-- Background Grid Lines -->
            @for (grid of yGridLines(); track grid.y) {
              <line
                x1="45"
                [attr.y1]="grid.y"
                x2="590"
                [attr.y2]="grid.y"
                stroke="var(--border-color, #e5e7eb)"
                stroke-width="1"
                stroke-dasharray="3,3"
              />
              <text
                x="40"
                [attr.y]="grid.y + 4"
                text-anchor="end"
                font-size="10"
                fill="var(--color-gray-500, #6b7280)"
              >
                {{ valuePrefix() }}{{ grid.val | number:'1.0-0' }}{{ valueSuffix() }}
              </text>
            }

            <!-- Bars -->
            @for (bar of barItems(); track bar.label; let i = $index) {
              <g
                class="chart-bar-group"
                (mouseenter)="hoveredIndex.set(i)"
                (mouseleave)="hoveredIndex.set(null)"
                tabindex="0"
                (focus)="hoveredIndex.set(i)"
                (blur)="hoveredIndex.set(null)"
                [attr.aria-label]="bar.label + ': ' + valuePrefix() + bar.value + valueSuffix()"
              >
                <!-- Hitbox for easy hover interaction -->
                <rect
                  [attr.x]="bar.x - bar.width / 2"
                  y="10"
                  [attr.width]="bar.width"
                  height="170"
                  fill="transparent"
                  class="hitbox"
                />

                <!-- Main Bar -->
                <rect
                  [attr.x]="bar.x - (bar.width * 0.7) / 2"
                  [attr.y]="bar.y"
                  [attr.width]="bar.width * 0.7"
                  [attr.height]="bar.height"
                  [attr.fill]="hoveredIndex() === i ? 'var(--color-primary-700, #1d4ed8)' : color()"
                  rx="3"
                  class="bar-rect"
                />

                <!-- X-Axis Label -->
                @if (shouldShowLabel(i, barItems().length)) {
                  <text
                    [attr.x]="bar.x"
                    y="198"
                    text-anchor="middle"
                    font-size="9.5"
                    fill="var(--color-gray-600, #4b5563)"
                  >
                    {{ bar.shortLabel }}
                  </text>
                }
              </g>
            }

            <!-- Bottom Axis Baseline -->
            <line x1="45" y1="180" x2="590" y2="180" stroke="var(--border-color, #cbd5e1)" stroke-width="1.5" />
          </svg>

          <!-- Active Hover Tooltip -->
          @if (activeItem(); as active) {
            <div class="chart-tooltip" [style.left.%]="active.percentX">
              <span class="tooltip-label">{{ active.item.label }}</span>
              <span class="tooltip-value font-semibold">
                {{ primaryLabel() }}: {{ valuePrefix() }}{{ active.item.value | number:'1.0-2' }}{{ valueSuffix() }}
              </span>
              @if (secondaryLabel() && active.item.secondaryValue !== undefined) {
                <span class="tooltip-secondary text-xs">
                  {{ secondaryLabel() }}: {{ valuePrefix() }}{{ active.item.secondaryValue | number:'1.0-2' }}{{ valueSuffix() }}
                </span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .trend-chart-card {
      padding: var(--space-4);
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      position: relative;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .chart-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chart-title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .chart-subtitle {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .chart-empty-state {
      padding: var(--space-8);
      text-align: center;
      color: var(--color-gray-500);
    }

    .empty-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: var(--space-2);
      opacity: 0.7;
    }

    .svg-container {
      position: relative;
      width: 100%;
      height: 220px;
      overflow: hidden;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .chart-bar-group {
      cursor: pointer;
      outline: none;
    }

    .bar-rect {
      transition: y 0.2s ease, height 0.2s ease, fill 0.15s ease;
    }

    .chart-tooltip {
      position: absolute;
      top: 10px;
      transform: translateX(-50%);
      background-color: #1f2937;
      color: #ffffff;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      box-shadow: var(--shadow-md);
      pointer-events: none;
      z-index: 10;
      white-space: nowrap;
      display: flex;
      flex-direction: column;
      gap: 2px;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -4px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    .tooltip-label {
      color: #9ca3af;
      font-size: 10px;
    }

    .tooltip-secondary {
      color: #cbd5e1;
    }

    .chart-table-wrap {
      max-height: 220px;
      overflow-y: auto;
    }

    .chart-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-xs);
    }

    .chart-table th,
    .chart-table td {
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .chart-table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-700);
      font-weight: var(--font-weight-semibold);
    }

    .text-right {
      text-align: right;
    }

    .font-medium {
      font-weight: 500;
    }

    .text-muted {
      color: var(--color-gray-500);
    }

    .btn-xs {
      padding: 3px 8px;
      font-size: 11px;
    }
  `]
})
export class TrendChartComponent {
  readonly title = input<string>('Daily Trend');
  readonly data = input<TrendDataPoint[]>([]);
  readonly valuePrefix = input<string>('');
  readonly valueSuffix = input<string>('');
  readonly color = input<string>('var(--color-primary-600, #2563eb)');
  readonly primaryLabel = input<string>('Total');
  readonly secondaryLabel = input<string | null>(null);

  readonly showTable = signal<boolean>(false);
  readonly hoveredIndex = signal<number | null>(null);

  toggleTableView(): void {
    this.showTable.update((v) => !v);
  }

  readonly maxValue = computed(() => {
    const items = this.data();
    if (items.length === 0) return 1;
    const max = Math.max(...items.map((d) => d.value));
    return max > 0 ? max : 1;
  });

  readonly yGridLines = computed(() => {
    const max = this.maxValue();
    return [
      { y: 20, val: max },
      { y: 73, val: max * 0.66 },
      { y: 126, val: max * 0.33 },
      { y: 180, val: 0 }
    ];
  });

  readonly barItems = computed(() => {
    const items = this.data();
    if (items.length === 0) return [];

    const startX = 65;
    const totalWidth = 510;
    const maxVal = this.maxValue();
    const count = items.length;
    const step = count > 1 ? totalWidth / (count - 1) : totalWidth / 2;
    const barWidth = Math.max(10, Math.min(36, totalWidth / count));

    return items.map((item, i) => {
      const x = count === 1 ? startX + totalWidth / 2 : startX + i * step;
      const height = Math.max(4, Math.round((item.value / maxVal) * 155));
      const y = 180 - height;
      const shortLabel = this.formatShortLabel(item.label);

      return {
        label: item.label,
        shortLabel,
        value: item.value,
        secondaryValue: item.secondaryValue,
        x,
        y,
        width: barWidth,
        height
      };
    });
  });

  readonly activeItem = computed(() => {
    const index = this.hoveredIndex();
    if (index === null) return null;
    const items = this.barItems();
    if (index < 0 || index >= items.length) return null;

    const bar = items[index];
    const rawItem = this.data()[index];
    const percentX = Math.max(10, Math.min(90, (bar.x / 600) * 100));

    return { item: rawItem, percentX };
  });

  shouldShowLabel(index: number, total: number): boolean {
    if (total <= 12) return true;
    if (total <= 31) return index % 3 === 0 || index === total - 1;
    return index % Math.ceil(total / 10) === 0 || index === total - 1;
  }

  private formatShortLabel(label: string): string {
    // If format is YYYY-MM-DD, parse as month + day
    if (label.includes('-')) {
      const parts = label.split('-');
      if (parts.length >= 3) {
        return `${parts[1]}/${parts[2]}`;
      }
    }
    return label.length > 8 ? label.substring(0, 8) : label;
  }
}
