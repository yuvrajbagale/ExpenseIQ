export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
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
  recurringFrequency?: RecurringFrequency;
  notes?: string;
}

export interface TransactionFilters {
  search: string;
  type: TransactionType | 'all';
  status: TransactionStatus | 'all';
  dateFrom: Date | null;
  dateTo: Date | null;
  categories: string[];
  paymentMethods: PaymentMethod[];
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
