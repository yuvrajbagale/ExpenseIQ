import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EiqCurrencyPipe } from '../../shared/pipes/eiq-currency.pipe';
import { Transaction } from '../../core/interfaces/transaction.interface';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe, RouterLink, SidebarComponent, HeaderComponent, StatusBadgeComponent, EiqCurrencyPipe],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" searchPlaceholder="Search anything…" (searchChanged)="onSearch($event)" />
        <main class="eiq-content">

          <!-- Page Header -->
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Transaction History</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" [routerLink]="'/dashboard'">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Transactions</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm" [routerLink]="'/add-transaction'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Transaction
              </button>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
            </div>
          </div>

          <!-- Filter Bar -->
          <div class="eiq-card eiq-filter-bar">
            <div class="eiq-filter-bar__search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input class="eiq-filter-bar__input" type="text" placeholder="Search transactions…" [(ngModel)]="searchQuery" (input)="applySearch()" />
            </div>
            <div class="eiq-filter-bar__filters">
              <select class="eiq-select" [(ngModel)]="selectedType" (change)="applyFilters()">
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select class="eiq-select" [(ngModel)]="selectedStatus" (change)="applyFilters()">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="clearFilters()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clear
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="eiq-card eiq-txn-table-card">
            <div class="eiq-txn-table-wrap">
              <table class="eiq-txn-table">
                <thead>
                  <tr>
                    <th class="eiq-txn-th eiq-txn-th--check"><input type="checkbox" class="eiq-checkbox" (change)="toggleSelectAll($event)" /></th>
                    <th class="eiq-txn-th">#</th>
                    <th class="eiq-txn-th">Category</th>
                    <th class="eiq-txn-th">Description</th>
                    <th class="eiq-txn-th">Date</th>
                    <th class="eiq-txn-th">Method</th>
                    <th class="eiq-txn-th eiq-txn-th--right">Amount</th>
                    <th class="eiq-txn-th">Status</th>
                    <th class="eiq-txn-th eiq-txn-th--center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (txn of paginatedTxns(); track txn.id; let i = $index) {
                    <tr class="eiq-txn-row" [class.eiq-txn-row--selected]="selectedIds().has(txn.id)" [class.eiq-txn-row--alt]="i % 2 === 0">
                      <td class="eiq-txn-td eiq-txn-td--check">
                        <input type="checkbox" class="eiq-checkbox" [checked]="selectedIds().has(txn.id)" (change)="toggleSelect(txn.id)" />
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--mono">{{ padIndex(i) }}</td>
                      <td class="eiq-txn-td">
                        <div class="eiq-cat-cell">
                          <div class="eiq-cat-icon" [class]="'eiq-cat-icon--' + getCategoryColor(txn.category)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="getCategoryIcon(txn.category)"></svg>
                          </div>
                          <span class="eiq-cat-name">{{ txn.category }}</span>
                        </div>
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--muted">{{ txn.description }}</td>
                      <td class="eiq-txn-td eiq-txn-td--nowrap eiq-txn-td--muted">{{ txn.date | date:'MMM dd, yyyy' }}</td>
                      <td class="eiq-txn-td">
                        <span class="eiq-method-badge eiq-method-badge--{{ txn.paymentMethod }}">{{ txn.paymentMethod | titlecase }}</span>
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--right">
                        <span [class]="txn.type === 'income' ? 'eiq-amount eiq-amount--pos' : 'eiq-amount eiq-amount--neg'">
                          {{ signedAmount(txn) | eiqCurrency }}
                        </span>
                      </td>
                      <td class="eiq-txn-td"><app-status-badge [status]="txn.status" /></td>
                      <td class="eiq-txn-td eiq-txn-td--center">
                        <div class="eiq-txn-actions">
                          <button class="eiq-icon-btn" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                          <button class="eiq-icon-btn eiq-icon-btn--danger" title="Delete" (click)="deleteTransaction(txn.id)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                          <button class="eiq-icon-btn" title="View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="9" class="eiq-txn-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                      <p>No transactions found</p>
                    </td></tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="eiq-pagination">
              <div class="eiq-pagination__info">
                <span>Rows per page:</span>
                <select class="eiq-select eiq-select--xs" [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)">
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="25">25</option>
                  <option [ngValue]="50">50</option>
                </select>
                <span>Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ filteredTxns().length }} transactions</span>
              </div>
              <div class="eiq-pagination__controls">
                <button class="eiq-page-btn eiq-page-btn--arrow" [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                @for (p of pageNumbers(); track p) {
                  @if (p === -1) { <span class="eiq-page-ellipsis">…</span> }
                  @else { <button class="eiq-page-btn" [class.eiq-page-btn--active]="p === currentPage()" (click)="setPage(p)">{{ p }}</button> }
                }
                <button class="eiq-page-btn eiq-page-btn--arrow" [disabled]="currentPage() === totalPages()" (click)="setPage(currentPage() + 1)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
})
export class TransactionsComponent {
  protected readonly authService = inject(AuthService);
  protected readonly txnService  = inject(TransactionService);
  private readonly sanitizer     = inject(DomSanitizer);

  searchQuery   = '';
  selectedType   = 'all';
  selectedStatus = 'all';
  readonly pageSize = signal(10);
  readonly currentPage = signal(1);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',        route: '/dashboard',       icon: 'dashboard', exact: true },
    { label: 'Transactions',     route: '/transactions',    icon: 'swap_horiz' },
    { label: 'Add Transaction',  route: '/add-transaction', icon: 'add_circle' },
    { label: 'Categories',       route: '/categories',      icon: 'label' },
    { label: 'Budget',           route: '/budget',          icon: 'pie_chart' },
    { label: 'Analytics',        route: '/analytics',       icon: 'trending_up' },
    { label: 'Reports',          route: '/reports',         icon: 'description' },
    { label: 'Goals',            route: '/goals',           icon: 'flag' },
    { label: 'Calendar',         route: '/calendar',        icon: 'calendar_month' },
    { label: 'Wallet Accounts',  route: '/accounts',        icon: 'account_balance_wallet' },
    { label: 'Recurring',        route: '/recurring',       icon: 'autorenew' },
  ];

  readonly filteredTxns = computed<Transaction[]>(() => {
    let list = this.txnService.filteredTransactions();
    if (this.selectedType !== 'all')   list = list.filter(t => t.type === this.selectedType);
    if (this.selectedStatus !== 'all') list = list.filter(t => t.status === this.selectedStatus);
    return list;
  });

  readonly totalPages  = computed(() => Math.max(1, Math.ceil(this.filteredTxns().length / this.pageSize())));
  readonly rangeStart  = computed(() => Math.min((this.currentPage() - 1) * this.pageSize() + 1, this.filteredTxns().length || 1));
  readonly rangeEnd    = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredTxns().length));

  readonly paginatedTxns = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTxns().slice(start, start + this.pageSize());
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages(), cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  onSearch(q: string): void { this.txnService.updateFilters({ search: q }); this.currentPage.set(1); }
  applySearch(): void { this.txnService.updateFilters({ search: this.searchQuery }); this.currentPage.set(1); }
  applyFilters(): void { this.currentPage.set(1); }
  clearFilters(): void { this.searchQuery=''; this.selectedType='all'; this.selectedStatus='all'; this.txnService.updateFilters({ search: '' }); this.currentPage.set(1); }
  setPage(p: number): void { if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p); }
  onPageSizeChange(size: number): void { this.pageSize.set(Number(size) || 10); this.currentPage.set(1); }
  toggleSelect(id: string): void { const s = new Set(this.selectedIds()); s.has(id) ? s.delete(id) : s.add(id); this.selectedIds.set(s); }
  toggleSelectAll(e: Event): void { const ck = (e.target as HTMLInputElement).checked; this.selectedIds.set(ck ? new Set(this.filteredTxns().map(t => t.id)) : new Set()); }
  deleteTransaction(id: string): void { if (confirm('Delete this transaction?')) this.txnService.deleteTransaction(id); }

  /** Zero-padded row index for display (1-based). */
  padIndex(i: number): string { return String(i + 1).padStart(3, '0'); }

  /** Signed amount: negative for expenses, positive for income. */
  signedAmount(txn: Transaction): number {
    return txn.type === 'expense' ? -Math.abs(txn.amount) : Math.abs(txn.amount);
  }

  getCategoryColor(cat: string): string {
    const map: Record<string, string> = { Salary:'blue', Food:'orange', Utilities:'blue', Transport:'blue', Entertainment:'yellow', Health:'teal', Freelance:'green', Housing:'blue', Fitness:'yellow' };
    return map[cat] ?? 'blue';
  }

  private readonly iconCache = new Map<string, SafeHtml>();
  getCategoryIcon(cat: string): SafeHtml {
    const cached = this.iconCache.get(cat);
    if (cached) return cached;
    const raw = CATEGORY_ICON_MARKUP[cat] ?? '<circle cx="12" cy="12" r="10"/>';
    const safe = this.sanitizer.bypassSecurityTrustHtml(raw);
    this.iconCache.set(cat, safe);
    return safe;
  }
}

const CATEGORY_ICON_MARKUP: Record<string, string> = {
  Salary:        '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  Food:          '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  Utilities:     '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  Transport:     '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  Entertainment: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
  Health:        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  Freelance:     '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  Housing:       '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  Fitness:       '<path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
};
