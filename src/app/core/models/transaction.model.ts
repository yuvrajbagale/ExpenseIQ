import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  TransactionFilters,
} from '../interfaces/transaction.interface';

// Alias for backwards compatibility
export type { Transaction };
export type TransactionFilter = TransactionFilters;

export interface TransactionSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savings: number;
}

export class TransactionModel implements Transaction {
  id: string;
  type: TransactionType;
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  tags: string[];
  location?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: any;
  notes?: string;

  constructor(data: Partial<Transaction>) {
    this.id              = data.id ?? crypto.randomUUID();
    this.type            = data.type ?? 'expense';
    this.category        = data.category ?? '';
    this.subCategory     = data.subCategory;
    this.description     = data.description ?? '';
    this.amount          = data.amount ?? 0;
    this.date            = data.date ? new Date(data.date) : new Date();
    this.paymentMethod   = data.paymentMethod ?? 'cash';
    this.status          = data.status ?? 'completed';
    this.tags            = data.tags ?? [];
    this.location        = data.location;
    this.receiptUrl      = data.receiptUrl;
    this.isRecurring     = data.isRecurring ?? false;
    this.recurringFrequency = data.recurringFrequency;
    this.notes           = data.notes;
  }

  get formattedAmount(): string {
    const prefix = this.type === 'expense' ? '-' : '+';
    return `${prefix}$${Math.abs(this.amount).toFixed(2)}`;
  }

  get formattedDate(): string {
    return this.date.toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
    });
  }
}
