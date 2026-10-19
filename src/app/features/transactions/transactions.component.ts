import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { NAV_ITEMS } from '../../shared/constants/nav-items';
import { HeaderComponent } from '../../shared/components/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { EiqCurrencyPipe } from '../../shared/pipes/eiq-currency.pipe';
import { AppIconName, CATEGORY_ICONS } from '../../shared/icons/app-icons';
import { Transaction } from '../../core/interfaces/transaction.interface';

/** Icon names used on the transactions page, resolved from the shared registry. */
const ICON = {
  add: 'lucidePlus',
  download: 'lucideDownload',
  close: 'lucideX',
  search: 'lucideSearch',
  filter: 'lucideSlidersHorizontal',
  view: 'lucideEye',
  delete: 'lucideTrash2',
  empty: 'lucideInbox',
  chevronLeft: 'lucideChevronLeft',
  chevronRight: 'lucideChevronRight',
} as const;

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TitleCasePipe,
    RouterLink,
    SidebarComponent,
    HeaderComponent,
    StatusBadgeComponent,
    IconComponent,
    EiqCurrencyPipe,
  ],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="authService.logout()" />

      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="3"
          searchPlaceholder="Search transactions…"
          (searchChanged)="onSearch($event)" />

        <main class="eiq-content">
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Transactions</h1>
              <nav class="eiq-breadcrumb" aria-label="Breadcrumb">
                <a class="eiq-breadcrumb__link" routerLink="/dashboard">Dashboard</a>
                <span class="eiq-breadcrumb__sep" aria-hidden="true">
                  <eiq-icon [name]="icons.chevronRight" [size]="12" [strokeWidth]="2.2" />
                </span>
                <span class="eiq-breadcrumb__active" aria-current="page">Transactions</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="exportCsv()">
                <eiq-icon [name]="icons.download" [size]="16" [strokeWidth]="2" anim="draw" />
                Export CSV
              </button>
              <a class="eiq-btn eiq-btn--primary eiq-btn--sm" routerLink="/transactions/add">
                <eiq-icon [name]="icons.add" [size]="16" [strokeWidth]="2.2" anim="draw" />
                Add transaction
              </a>
            </div>
          </div>

          <!-- ── Filters ── -->
          <div class="eiq-card eiq-filter-bar">
            <div class="eiq-filter-bar__search">
              <span class="eiq-filter-bar__search-icon" aria-hidden="true">
                <eiq-icon [name]="icons.search" [size]="16" [strokeWidth]="2" />
              </span>
              <input class="eiq-filter-bar__input" type="search" aria-label="Search transactions"
                     placeholder="Search description, category, amount…"
                     [(ngModel)]="searchQuery" (input)="applySearch()" />
              @if (searchQuery) {
                <button type="button" class="eiq-filter-bar__clear"
                        aria-label="Clear search"
                        (click)="clearSearch()">
                  <eiq-icon name="lucideX" [size]="14" [strokeWidth]="2.2" anim="pop" />
                </button>
              }
            </div>
            <p class="eiq-filter-bar__count" role="status" aria-live="polite">
              {{ resultLabel() }}
            </p>
            <div class="eiq-filter-bar__filters">
              <select class="eiq-select" aria-label="Filter by type" [(ngModel)]="selectedType" (change)="applyFilters()">
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select class="eiq-select" aria-label="Filter by status" [(ngModel)]="selectedStatus" (change)="applyFilters()">
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              @if (hasActiveFilters()) {
                <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="clearFilters()">
                  <eiq-icon [name]="icons.close" [size]="16" [strokeWidth]="2.2" anim="pop" />
                  Clear
                </button>
              }
            </div>
          </div>

          <!-- ── Bulk action bar ── -->
          @if (selectedCount() > 0) {
            <div class="eiq-bulkbar" role="status">
              <span class="eiq-bulkbar__count">{{ selectedCount() }} selected</span>
              <div class="eiq-bulkbar__actions">
                <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="clearSelection()">Deselect all</button>
                <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="deleteSelected()">
                  <eiq-icon name="lucideTrash2" [size]="15" [strokeWidth]="2" anim="pop" />
                  Delete selected
                </button>
              </div>
            </div>
          }

          <!-- ── Table ── -->
          <div class="eiq-card eiq-txn-table-card">
            <div class="eiq-txn-table-wrap">
              <table class="eiq-txn-table">
                <thead>
                  <tr>
                    <th class="eiq-txn-th eiq-txn-th--check" scope="col">
                      <input type="checkbox" class="eiq-checkbox" aria-label="Select all on this page"
                             [checked]="allPageSelected()" (change)="toggleSelectPage($event)" />
                    </th>
                    <th class="eiq-txn-th" scope="col">Category</th>
                    <th class="eiq-txn-th" scope="col">Description</th>
                    <th class="eiq-txn-th" scope="col">Date</th>
                    <th class="eiq-txn-th" scope="col">Method</th>
                    <th class="eiq-txn-th eiq-txn-th--right" scope="col">Amount</th>
                    <th class="eiq-txn-th" scope="col">Status</th>
                    <th class="eiq-txn-th eiq-txn-th--center" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (txn of paginatedTxns(); track txn.id; let i = $index) {
                    <tr class="eiq-txn-row"
                        [class.eiq-txn-row--selected]="selectedIds().has(txn.id)"
                        [class.eiq-txn-row--alt]="i % 2 === 1">
                      <td class="eiq-txn-td eiq-txn-td--check">
                        <input type="checkbox" class="eiq-checkbox"
                               [attr.aria-label]="'Select ' + (txn.description || txn.category)"
                               [checked]="selectedIds().has(txn.id)" (change)="toggleSelect(txn.id)" />
                      </td>
                      <td class="eiq-txn-td">
                        <div class="eiq-cat-cell">
                          <div class="eiq-cat-icon" [class]="'eiq-cat-icon--' + getCategoryColor(txn.category)">
                            <eiq-icon [name]="categoryIcon(txn.category)" [size]="16" [strokeWidth]="1.9" anim="pop" />
                          </div>
                          <span class="eiq-cat-name">{{ txn.category }}</span>
                        </div>
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--muted">{{ txn.description || '—' }}</td>
                      <td class="eiq-txn-td eiq-txn-td--nowrap eiq-txn-td--muted">{{ txn.date | date: 'MMM dd, yyyy' }}</td>
                      <td class="eiq-txn-td">
                        <span class="eiq-method-badge" [class]="'eiq-method-badge--' + txn.paymentMethod">{{ txn.paymentMethod | titlecase }}</span>
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--right">
                        <span class="eiq-amount" [class]="txn.type === 'income' ? 'eiq-amount--pos' : 'eiq-amount--neg'">
                          {{ signedAmount(txn) | eiqCurrency }}
                        </span>
                      </td>
                      <td class="eiq-txn-td"><app-status-badge [status]="txn.status" /></td>
                      <td class="eiq-txn-td eiq-txn-td--center">
                        <div class="eiq-txn-actions">
                          <button class="eiq-icon-btn" title="View" [attr.aria-label]="'View ' + (txn.description || txn.category)">
                            <eiq-icon [name]="icons.view" [size]="16" anim="pop" />
                          </button>
                          <button class="eiq-icon-btn eiq-icon-btn--danger" title="Delete" [attr.aria-label]="'Delete ' + (txn.description || txn.category)" (click)="deleteTransaction(txn.id)">
                            <eiq-icon [name]="icons.delete" [size]="16" anim="pop" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="eiq-txn-empty">
                        <eiq-icon [name]="icons.empty" [size]="44" [strokeWidth]="1.3" />
                        <p class="eiq-empty-state__title">{{ hasActiveFilters() ? 'No matching transactions' : 'No transactions yet' }}</p>
                        <p class="eiq-empty-state__desc">
                          {{ hasActiveFilters() ? 'Try adjusting or clearing your filters.' : 'Add your first transaction to start tracking spending.' }}
                        </p>
                        @if (hasActiveFilters()) {
                          <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" style="margin-top:12px" (click)="clearFilters()">Clear filters</button>
                        } @else {
                          <a class="eiq-btn eiq-btn--primary eiq-btn--sm" style="margin-top:12px" routerLink="/transactions/add">Add transaction</a>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (filteredTxns().length > 0) {
              <div class="eiq-pagination">
                <div class="eiq-pagination__info">
                  <span>Rows</span>
                  <select class="eiq-select eiq-select--xs" aria-label="Rows per page"
                          [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
                    <option [ngValue]="10">10</option>
                    <option [ngValue]="25">25</option>
                    <option [ngValue]="50">50</option>
                  </select>
                  <span>{{ rangeStart() }}–{{ rangeEnd() }} of {{ filteredTxns().length }}</span>
                </div>
                <nav class="eiq-pagination__controls" aria-label="Pagination">
                  <button class="eiq-page-btn eiq-page-btn--arrow" aria-label="Previous page"
                          [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">
                    <eiq-icon [name]="icons.chevronLeft" [size]="16" [strokeWidth]="2.2" anim="pop" />
                  </button>
                  @for (p of pageNumbers(); track $index) {
                    @if (p === -1) {
                      <span class="eiq-page-ellipsis">…</span>
                    } @else {
                      <button class="eiq-page-btn" [class.eiq-page-btn--active]="p === currentPage()"
                              [attr.aria-current]="p === currentPage() ? 'page' : null"
                              (click)="setPage(p)">{{ p }}</button>
                    }
                  }
                  <button class="eiq-page-btn eiq-page-btn--arrow" aria-label="Next page"
                          [disabled]="currentPage() === totalPages()" (click)="setPage(currentPage() + 1)">
                    <eiq-icon [name]="icons.chevronRight" [size]="16" [strokeWidth]="2.2" anim="pop" />
                  </button>
                </nav>
              </div>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .eiq-bulkbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 10px 14px;
      border-radius: var(--eiq-radius);
      background: var(--eiq-primary-softer);
      border: 1px solid var(--eiq-primary-ring);
      animation: eiq-rise-in 200ms cubic-bezier(0.2, 0, 0.2, 1);
    }
    .eiq-bulkbar__count { font-size: 0.8125rem; font-weight: 700; color: var(--eiq-primary); }
    .eiq-bulkbar__actions { display: flex; align-items: center; gap: 8px; }
    .eiq-filter-bar__search-icon { display: flex; }
    .eiq-filter-bar__search-icon eiq-icon { color: var(--eiq-faint); }
    .eiq-icon-btn eiq-icon, .eiq-btn eiq-icon { display: flex; }
  `],
})
export class TransactionsComponent {
  protected readonly authService = inject(AuthService);
  protected readonly txnService = inject(TransactionService);
  private readonly toast = inject(ToastService);

  readonly icons = ICON;
  readonly navItems = NAV_ITEMS;

  searchQuery = '';
  selectedType = 'all';
  selectedStatus = 'all';

  readonly pageSize = signal(10);
  readonly currentPage = signal(1);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly filteredTxns = computed<Transaction[]>(() => {
    let list = this.txnService.filteredTransactions();
    if (this.selectedType !== 'all') list = list.filter((t) => t.type === this.selectedType);
    if (this.selectedStatus !== 'all') list = list.filter((t) => t.status === this.selectedStatus);
    return list;
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery.trim().length > 0 ||
      this.selectedType !== 'all' ||
      this.selectedStatus !== 'all'
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTxns().length / this.pageSize()))
  );
  readonly rangeStart = computed(() =>
    Math.min((this.currentPage() - 1) * this.pageSize() + 1, Math.max(this.filteredTxns().length, 1))
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredTxns().length)
  );

  readonly paginatedTxns = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTxns().slice(start, start + this.pageSize());
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allPageSelected = computed(() => {
    const page = this.paginatedTxns();
    return page.length > 0 && page.every((t) => this.selectedIds().has(t.id));
  });

  onSearch(q: string): void {
    this.txnService.updateFilters({ search: q });
    this.currentPage.set(1);
  }

  applySearch(): void {
    this.txnService.updateFilters({ search: this.searchQuery });
    this.currentPage.set(1);
  }

  applyFilters(): void {
    this.currentPage.set(1);
  }

  /** Empties just the search box, leaving the type/status filters alone. */
  clearSearch(): void {
    this.searchQuery = '';
    this.txnService.updateFilters({ search: '' });
    this.currentPage.set(1);
  }

  /** `12 of 48` while filtering, `48 transactions` otherwise. */
  protected resultLabel(): string {
    const shown = this.filteredTxns().length;
    const total = this.txnService.pagination().total || shown;
    if (!this.hasActiveFilters()) return `${total} transaction${total === 1 ? '' : 's'}`;
    return `${shown} ${shown === 1 ? 'result' : 'results'} of ${total}`;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = 'all';
    this.selectedStatus = 'all';
    this.txnService.updateFilters({ search: '' });
    this.currentPage.set(1);
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(Number(size) || 10);
    this.currentPage.set(1);
  }

  toggleSelect(id: string): void {
    const s = new Set(this.selectedIds());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.selectedIds.set(s);
  }

  toggleSelectPage(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    const s = new Set(this.selectedIds());
    for (const t of this.paginatedTxns()) {
      if (checked) s.add(t.id);
      else s.delete(t.id);
    }
    this.selectedIds.set(s);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  deleteTransaction(id: string): void {
    if (!confirm('Delete this transaction?')) return;
    this.txnService.deleteTransaction(id).subscribe({
      next: () => {
        this.clearSelection();
        this.toast.success('Transaction deleted.');
      },
      error: () => this.toast.error('Unable to delete the transaction. Check that the API is running.'),
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected transaction${ids.length > 1 ? 's' : ''}?`)) return;

    let remaining = ids.length;
    let failed = 0;
    for (const id of ids) {
      this.txnService.deleteTransaction(id).subscribe({
        next: () => {
          if (--remaining === 0) this.finishBulk(failed);
        },
        error: () => {
          failed++;
          if (--remaining === 0) this.finishBulk(failed);
        },
      });
    }
  }

  exportCsv(): void {
    const rows = this.filteredTxns();
    if (!rows.length) {
      this.toast.warning('No transactions to export with the current filters.');
      return;
    }
    const header = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Status'];
    const body = rows.map((t) => [
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.category,
      `"${(t.description ?? '').replace(/"/g, '""')}"`,
      t.amount.toString(),
      t.paymentMethod,
      t.status,
    ]);
    const csv = [header, ...body].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenseiq-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success(`Exported ${rows.length} transactions.`);
  }

  /** Signed amount: negative for expenses, positive for income. */
  signedAmount(txn: Transaction): number {
    return txn.type === 'expense' ? -Math.abs(txn.amount) : Math.abs(txn.amount);
  }

  getCategoryColor(cat: string): string {
    const map: Record<string, string> = {
      Salary: 'green',
      Freelance: 'green',
      Food: 'orange',
      Utilities: 'yellow',
      Transport: 'blue',
      Entertainment: 'yellow',
      Health: 'teal',
      Housing: 'blue',
      Fitness: 'teal',
    };
    return map[cat] ?? 'blue';
  }

  /** Icon for a transaction category; unmapped categories fall back to a receipt. */
  categoryIcon(cat: string): AppIconName {
    return CATEGORY_ICONS[cat] ?? 'lucideReceipt';
  }

  private finishBulk(failed: number): void {
    this.clearSelection();
    if (failed === 0) this.toast.success('Selected transactions deleted.');
    else this.toast.error(`${failed} transaction${failed > 1 ? 's' : ''} could not be deleted.`);
  }
}
