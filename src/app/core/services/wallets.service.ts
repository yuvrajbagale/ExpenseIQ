import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export type WalletKind = 'bank' | 'credit' | 'cash' | 'upi';

export interface WalletAccount {
  id: string;
  name: string;
  kind: WalletKind;
  maskedNumber: string;
  balance: number;
  income: number;
  expense: number;
  gradientFrom: string;
  gradientTo: string;
}

export interface AccountTransaction {
  name: string;
  date: string;
  account: string;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class WalletsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/accounts`;

  private readonly _accounts = signal<WalletAccount[]>([]);
  private readonly _filter = signal<string>('all');
  private readonly _accountTransactions = signal<AccountTransaction[]>([]);

  readonly accounts = computed(() => this._accounts());
  readonly filter = computed(() => this._filter());

  readonly totals = computed(() => {
    const list = this._accounts();
    return {
      totalBalance: list.reduce((a, w) => a + w.balance, 0),
      totalIncome: list.reduce((a, w) => a + w.income, 0),
      totalExpense: list.reduce((a, w) => a + w.expense, 0),
      balanceTrend: 2.4,
      incomeTrend: 5.1,
      expenseTrend: -3.2,
    };
  });

  readonly filteredTransactions = computed(() => {
    const f = this._filter();
    const txns = this._accountTransactions();
    if (f === 'all') return txns;
    return txns.filter(t => t.account.toLowerCase() === f.toLowerCase());
  });

  loadAccounts(): Observable<void> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        this._accounts.set(response.data.accounts);
      }),
      catchError(() => of(undefined))
    );
  }

  setFilter(filter: string): void { this._filter.set(filter); }
}
