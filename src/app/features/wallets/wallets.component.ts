import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletsService } from '../../core/services/wallets.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-wallets',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" searchPlaceholder="Search transactions, categories…" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Wallet Accounts</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Wallet Accounts</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Account
              </button>
            </div>
          </div>

          <div class="eiq-kpi-grid eiq-kpi-grid--3">
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label">Total Balance</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                </div>
              </div>
              <p class="eiq-kpi-card__value">\${{ wallets.totals().totalBalance.toLocaleString() }}</p>
              <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">+{{ wallets.totals().balanceTrend }}%</span>
            </div>
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label">Total Income This Month</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6L13.5 15.5L8.5 10.5L1 18"/></svg>
                </div>
              </div>
              <p class="eiq-kpi-card__value eiq-kpi-card__value--success">\${{ wallets.totals().totalIncome.toLocaleString() }}</p>
              <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">+{{ wallets.totals().incomeTrend }}%</span>
            </div>
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label">Total Expenses This Month</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18L13.5 8.5L8.5 13.5L1 6"/></svg>
                </div>
              </div>
              <p class="eiq-kpi-card__value eiq-kpi-card__value--danger">\${{ wallets.totals().totalExpense.toLocaleString() }}</p>
              <span class="eiq-kpi-card__trend eiq-kpi-card__trend--down">{{ wallets.totals().expenseTrend }}%</span>
            </div>
          </div>

          <div class="wallet-grid">
            @for (acc of wallets.accounts(); track acc.id) {
              <div class="wallet-card" [style.background]="'linear-gradient(135deg, ' + acc.gradientFrom + ', ' + acc.gradientTo + ')'">
                <div class="wallet-card__top">
                  <span class="wallet-card__name">{{ acc.name }}</span>
                  <span class="wallet-card__kind">{{ kindLabel(acc.kind) }}</span>
                </div>
                <p class="wallet-card__number">{{ acc.maskedNumber }}</p>
                <p class="wallet-card__balance">\${{ acc.balance.toLocaleString() }}</p>
                <div class="wallet-card__flow">
                  <span>Income: +\${{ acc.income.toLocaleString() }}</span>
                  <span>Expense: -\${{ acc.expense.toLocaleString() }}</span>
                </div>
                <div class="wallet-card__actions">
                  <button class="wallet-card__btn"></button>
                  <button class="wallet-card__btn"></button>
                  <button class="wallet-card__btn"></button>
                </div>
              </div>
            }
          </div>

          <div class="eiq-card">
            <div class="eiq-card__header">
              <div>
                <h3 class="eiq-card__title">Account Transactions</h3>
              </div>
              <div class="eiq-page-header__actions">
                @for (acc of wallets.accounts(); track acc.id) {
                  <button class="eiq-range-btn" [class.eiq-range-btn--active]="wallets.filter() === acc.kind" (click)="wallets.setFilter(acc.kind)">{{ acc.name }}</button>
                }
                <button class="eiq-range-btn" [class.eiq-range-btn--active]="wallets.filter() === 'all'" (click)="wallets.setFilter('all')">All</button>
              </div>
            </div>
            <div class="eiq-txn-table-wrap">
              <table class="eiq-txn-table">
                <thead>
                  <tr>
                    <th class="eiq-txn-th">Transaction</th>
                    <th class="eiq-txn-th">Date</th>
                    <th class="eiq-txn-th">Account</th>
                    <th class="eiq-txn-th eiq-txn-th--right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (txn of wallets.filteredTransactions(); track txn.name; let i = $index) {
                    <tr class="eiq-txn-row" [class.eiq-txn-row--alt]="i % 2 === 0">
                      <td class="eiq-txn-td">{{ txn.name }}</td>
                      <td class="eiq-txn-td eiq-txn-td--muted">{{ txn.date }}</td>
                      <td class="eiq-txn-td"><span class="eiq-method-badge">{{ txn.account }}</span></td>
                      <td class="eiq-txn-td eiq-txn-td--right" [class.eiq-amount--pos]="txn.amount > 0" [class.eiq-amount--neg]="txn.amount < 0">
                        {{ txn.amount > 0 ? '+' : '' }}\${{ Math.abs(txn.amount).toFixed(2) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="eiq-card transfer-card">
            <h3 class="eiq-card__title">Transfer Between Accounts</h3>
            <p class="eiq-card__subtitle">Move money instantly between your linked wallets</p>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .wallet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .wallet-card { border-radius: 1rem; padding: 1.25rem; color: white; display: flex; flex-direction: column; gap: 0.5rem; min-height: 180px; }
    .wallet-card__top { display: flex; justify-content: space-between; align-items: center; }
    .wallet-card__name { font-size: 0.8125rem; font-weight: 700; }
    .wallet-card__kind { font-size: 0.625rem; background: rgba(255,255,255,0.2); border-radius: 9999px; padding: 2px 8px; }
    .wallet-card__number { font-size: 0.75rem; opacity: 0.7; margin: 0; letter-spacing: 0.05em; }
    .wallet-card__balance { font-size: 1.5rem; font-weight: 700; margin: 0.25rem 0; }
    .wallet-card__flow { display: flex; flex-direction: column; gap: 2px; font-size: 0.6875rem; opacity: 0.85; }
    .wallet-card__actions { display: flex; gap: 0.375rem; margin-top: 0.5rem; }
    .wallet-card__btn { flex: 1; height: 1.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.15); border: none; cursor: pointer; }
    .transfer-card { margin-top: 1rem; }
  `]
})
export class WalletsComponent {
  protected readonly authService = inject(AuthService);
  protected readonly wallets = inject(WalletsService);
  protected readonly Math = Math;
  private readonly router = inject(Router);

  kindLabel(kind: string): string {
    return { bank: 'Bank Account', credit: 'Credit Card', cash: 'Cash', upi: 'UPI/Digital' }[kind] ?? kind;
  }

  goTo(path: string): void { this.router.navigate([path]); }
}
