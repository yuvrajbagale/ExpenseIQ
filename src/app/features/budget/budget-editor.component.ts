import { Component, EventEmitter, HostListener, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import { BudgetService } from '../../core/services/budget.service';
import { IconComponent } from '../../shared/components/icon.component';
import { EiqCurrencyPipe } from '../../shared/pipes/eiq-currency.pipe';

/** Guard rail so a fat-fingered entry cannot blow up the totals. */
const MAX_LIMIT = 1_000_000;

interface EditorRow {
  category: string;
  color: string;
  /** Raw text so a half-typed "12." or "" is not clobbered by the model. */
  value: string;
  spent: number;
  suggestion: number | null;
  carryIn: number;
}

/**
 * Per-category budget limit editor.
 *
 * Rendered only while open — the parent owns the `@if`. Limits are edited as raw
 * text and converted on save, so intermediate states stay typeable.
 */
@Component({
  selector: 'app-budget-editor',
  standalone: true,
  imports: [FormsModule, DecimalPipe, IconComponent, EiqCurrencyPipe],
  template: `
    <div class="eiq-modal-overlay" (click)="onBackdrop($event)">
      <div class="eiq-modal eiq-modal--wide" role="dialog" aria-modal="true"
           aria-labelledby="budget-editor-title">

        <div class="eiq-modal__header">
          <div>
            <h2 class="eiq-modal__title" id="budget-editor-title">Set budgets</h2>
            <p class="be-sub">{{ budget.monthLabel() }}</p>
          </div>
          <button type="button" class="eiq-modal__close" aria-label="Close" (click)="cancel.emit()">
            <eiq-icon name="lucideX" [size]="18" [strokeWidth]="2" anim="pop" />
          </button>
        </div>

        <div class="eiq-modal__body">
          <div class="be-actions">
            <button type="button" class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="copyPrevious()">
              <eiq-icon name="lucideRefreshCw" [size]="14" [strokeWidth]="2" anim="pop" />
              Copy last month
            </button>
            <button type="button" class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="applyDefaults()">
              <eiq-icon name="lucideSettings" [size]="14" [strokeWidth]="2" anim="pop" />
              Use recommended
            </button>
          </div>

          <div class="be-rows">
            @for (row of rows(); track row.category) {
              <div class="be-row">
                <span class="be-row__dot" [style.background]="row.color"></span>
                <label class="be-row__name" [attr.for]="'be-' + row.category">
                  {{ row.category }}
                  @if (row.carryIn > 0) {
                    <span class="be-row__carry">+{{ row.carryIn | eiqCurrency: false }} rolled over</span>
                  }
                </label>

                <div class="be-row__input">
                  <span class="be-row__prefix" aria-hidden="true">$</span>
                  <input
                    [id]="'be-' + row.category"
                    class="eiq-input eiq-input--sm be-row__field"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    [max]="maxLimit"
                    step="10"
                    [ngModel]="row.value"
                    (ngModelChange)="setValue(row.category, $event)"
                    [attr.aria-label]="'Monthly limit for ' + row.category" />
                </div>

                <div class="be-row__meta">
                  @if (row.suggestion !== null) {
                    <button type="button" class="be-row__suggest" (click)="applySuggestion(row.category)"
                            [title]="'Apply the 3-month average of ' + (row.suggestion | eiqCurrency: false)">
                      avg {{ row.suggestion | eiqCurrency: false }}
                    </button>
                  } @else {
                    <span class="be-row__spent">{{ row.spent | eiqCurrency: false }} spent</span>
                  }
                  @if (row.spent > 0) {
                    <span class="be-row__spent">{{ row.spent | eiqCurrency: false }} spent</span>
                  }
                </div>
              </div>
            }
          </div>

          @if (invalid().length) {
            <p class="be-error" role="alert">
              <eiq-icon name="lucideTriangleAlert" [size]="14" [strokeWidth]="2" />
              Enter a number between 0 and {{ maxLimit | number }} for: {{ invalid().join(', ') }}
            </p>
          }

          <div class="be-total" [class.be-total--empty]="assigned() === 0">
            <span>Total assigned</span>
            <strong>{{ assigned() | eiqCurrency: false }}</strong>
          </div>
          @if (carryTotal() > 0) {
            <p class="be-note">{{ carryTotal() | eiqCurrency: false }} of that is rolled-over budget from last month.</p>
          }
        </div>

        <div class="eiq-modal__footer">
          <button type="button" class="eiq-btn eiq-btn--ghost" (click)="cancel.emit()">Cancel</button>
          <button type="button" class="eiq-btn eiq-btn--primary" [disabled]="invalid().length > 0"
                  (click)="commit()">
            Save budgets
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .eiq-modal--wide { max-width: 620px; }
    .be-sub { font-size: 0.75rem; color: var(--eiq-muted); margin: 2px 0 0; }
    .be-actions { display: flex; gap: 8px; margin-bottom: 0.875rem; flex-wrap: wrap; }

    .be-rows { display: flex; flex-direction: column; gap: 2px; }
    .be-row {
      display: grid;
      grid-template-columns: 10px minmax(0, 1fr) 116px 128px;
      gap: 10px; align-items: center;
      padding: 8px 6px; border-radius: var(--eiq-radius-xs);
      transition: background 150ms ease;
      &:hover { background: var(--eiq-hover); }
    }
    .be-row__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .be-row__name {
      font-size: 0.8125rem; font-weight: 600; color: var(--eiq-foreground);
      display: flex; flex-direction: column; gap: 1px; min-width: 0;
    }
    .be-row__carry { font-size: 0.625rem; font-weight: 600; color: var(--eiq-green); }
    .be-row__input { position: relative; display: flex; align-items: center; }
    .be-row__prefix {
      position: absolute; left: 9px; font-size: 0.75rem; font-weight: 600;
      color: var(--eiq-faint); pointer-events: none;
    }
    .be-row__field {
      width: 100%; padding-left: 20px; text-align: right;
      font-variant-numeric: tabular-nums;
      &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      -moz-appearance: textfield;
    }
    .be-row__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .be-row__spent { font-size: 0.625rem; color: var(--eiq-faint); white-space: nowrap; }
    .be-row__suggest {
      font-size: 0.625rem; font-weight: 700; color: var(--eiq-primary);
      background: var(--eiq-primary-softer); border: 1px solid var(--eiq-primary-ring);
      border-radius: 999px; padding: 1px 7px; cursor: pointer; white-space: nowrap;
      transition: background 150ms ease;
      &:hover { background: var(--eiq-primary-soft); }
    }

    .be-error {
      display: flex; align-items: center; gap: 6px;
      margin: 0.75rem 0 0; font-size: 0.75rem; color: var(--eiq-negative);
    }
    .be-total {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 1rem; padding-top: 0.875rem; border-top: 1px solid var(--eiq-border);
      font-size: 0.8125rem; font-weight: 600; color: var(--eiq-muted);
      strong { font-size: 1.125rem; color: var(--eiq-foreground); letter-spacing: -0.02em; }
    }
    .be-total--empty strong { color: var(--eiq-faint); }
    .be-note { margin: 0.25rem 0 0; font-size: 0.6875rem; color: var(--eiq-faint); text-align: right; }

    @media (max-width: 560px) {
      .be-row { grid-template-columns: 10px minmax(0, 1fr) 104px; }
      .be-row__meta { display: none; }
    }
  `]
})
export class BudgetEditorComponent {
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<Record<string, number>>();

  protected readonly budget = inject(BudgetService);
  protected readonly maxLimit = MAX_LIMIT;

  private readonly rowsState = signal<EditorRow[]>([]);

  protected readonly rows = computed(() => this.rowsState());

  /** Categories whose field cannot be parsed as a usable limit. */
  protected readonly invalid = computed(() =>
    this.rowsState()
      .filter((row) => !isValidLimit(row.value))
      .map((row) => row.category)
  );

  protected readonly assigned = computed(() =>
    Math.round(this.rowsState().reduce((sum, row) => sum + (toNumber(row.value) || 0), 0) * 100) / 100
  );

  /** The slice of the assigned total that came from rollover, not this month's limits. */
  protected readonly carryTotal = computed(() =>
    Math.round(
      this.rowsState().reduce((sum, row) => sum + (toNumber(row.value) || 0 ? row.carryIn : 0), 0) * 100
    ) / 100
  );

  constructor() {
    const saved = this.budget.rawLimits();
    this.rowsState.set(
      this.budget.categories().map((c) => ({
        category: c.category,
        color: c.color,
        value: saved[c.category] !== undefined ? `${saved[c.category]}` : '',
        spent: c.spent,
        suggestion: c.suggestion,
        carryIn: c.carryIn,
      }))
    );
  }

  protected setValue(category: string, raw: string | number): void {
    this.rowsState.update((rows) =>
      rows.map((row) => (row.category === category ? { ...row, value: `${raw}` } : row))
    );
  }

  protected applySuggestion(category: string): void {
    const row = this.rowsState().find((r) => r.category === category);
    if (!row || row.suggestion === null) return;
    this.setValue(category, `${row.suggestion}`);
  }

  protected copyPrevious(): void {
    const previous = this.budget.limitsForOffset(-1);
    this.rowsState.update((rows) =>
      rows.map((row) => ({
        ...row,
        value: previous[row.category] !== undefined ? `${previous[row.category]}` : '',
      }))
    );
  }

  protected applyDefaults(): void {
    const defaults = this.budget.defaults();
    this.rowsState.update((rows) =>
      rows.map((row) => (defaults[row.category] ? { ...row, value: `${defaults[row.category]}` } : row))
    );
  }

  protected commit(): void {
    if (this.invalid().length) return;
    const limits: Record<string, number> = {};
    for (const row of this.rowsState()) {
      const value = toNumber(row.value);
      if (value && value > 0) limits[row.category] = value;
    }
    this.saved.emit(limits);
  }

  /** Clicking the backdrop cancels; clicks inside the dialog must not bubble out. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }
}

function toNumber(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Blank is allowed (means "no limit"); anything else must be a number in range. */
function isValidLimit(value: string): boolean {
  if (value.trim() === '') return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_LIMIT;
}