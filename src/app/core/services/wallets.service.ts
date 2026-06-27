import { Injectable, computed, signal } from '@angular/core';

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

const ACCOUNTS: WalletAccount[] = [
  { id: 'chase',   name: 'Chase Checking',  kind: 'bank',   maskedNumber: '••••6521', balance: 12450.00, income: 5200, expense: 2840, gradientFrom: '#2b7fff', gradientTo: '#1a4fd6' },
  { id: 'amex',    name: 'Amex Gold',       kind: 'credit', maskedNumber: '••••9823', balance: 2340.00,  income: 0,    expense: 950,  gradientFrom: '#27272a', gradientTo: '#09090b' },
  { id: 'cash',    name: 'Personal Cash',   kind: 'cash',   maskedNumber: 'Cash',     balance: 850.00,   income: 300,  expense: 150,  gradientFrom: '#16a34a', gradientTo: '#0d6b30' },
  { id: 'paytm',   name: 'Paytm Wallet',    kind: 'upi',    maskedNumber: 'UPI/digital', balance: 1210.00, income: 600, expense: 320, gradientFrom: '#9333ea', gradientTo: '#6b21a8' },
];

const ACCOUNT_TRANSACTIONS: AccountTransaction[] = [
  { name: 'Grocery Store',       date: 'Jun 11, 2025', account: 'Card', amount: -84.50  },
  { name: 'Salary Deposit',      date: 'Jun 10, 2025', account: 'Bank', amount: 5200.00 },
  { name: 'Electricity Bill',    date: 'Jun 9, 2025',  account: 'UPI',  amount: -120.00 },
  { name: 'Uber Ride',           date: 'Jun 8, 2025',  account: 'Card', amount: -18.75  },
  { name: 'Netflix Subscription', date: 'Jun 7, 2025', account: 'Card', amount: -15.99  },
];

@Injectable({ providedIn: 'root' })
export class WalletsService {
  private readonly _accounts = signal<WalletAccount[]>(ACCOUNTS);
  private readonly _filter = signal<string>('all');

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
    if (f === 'all') return ACCOUNT_TRANSACTIONS;
    return ACCOUNT_TRANSACTIONS.filter(t => t.account.toLowerCase() === f.toLowerCase());
  });

  setFilter(filter: string): void { this._filter.set(filter); }
}
