import { Injectable, signal, computed } from '@angular/core';
import { Transaction, TransactionFilters, TransactionPagination } from '../interfaces/transaction.interface';
import { TransactionModel } from '../models/transaction.model';

const MOCK_TRANSACTIONS: Transaction[] = [
  { id:'001', type:'income', category:'Salary', description:'Salary Deposit', amount:5200, date:new Date('2025-06-10'), paymentMethod:'bank', status:'completed', tags:['income','salary'], isRecurring:true, recurringFrequency:'monthly' },
  { id:'002', type:'expense', category:'Food', description:'Grocery Store', amount:84.50, date:new Date('2025-06-11'), paymentMethod:'cash', status:'completed', tags:['food','groceries'], isRecurring:false },
  { id:'003', type:'expense', category:'Utilities', description:'Electricity Bill', amount:120, date:new Date('2025-06-09'), paymentMethod:'upi', status:'completed', tags:['utilities','bills'], isRecurring:true, recurringFrequency:'monthly' },
  { id:'004', type:'expense', category:'Transport', description:'Uber Ride', amount:18.75, date:new Date('2025-06-09'), paymentMethod:'card', status:'completed', tags:['transport'], isRecurring:false },
  { id:'005', type:'expense', category:'Utilities', description:'Electricity bill — June', amount:65, date:new Date('2025-06-28'), paymentMethod:'upi', status:'completed', tags:['utilities'], isRecurring:false },
  { id:'006', type:'expense', category:'Entertainment', description:'Netflix subscription', amount:15.99, date:new Date('2025-06-25'), paymentMethod:'card', status:'completed', tags:['entertainment','subscription'], isRecurring:true, recurringFrequency:'monthly' },
  { id:'007', type:'expense', category:'Health', description:'Pharmacy — vitamins', amount:34.50, date:new Date('2025-06-22'), paymentMethod:'cash', status:'completed', tags:['health'], isRecurring:false },
  { id:'008', type:'income', category:'Freelance', description:'Freelance Payment', amount:1200, date:new Date('2025-06-15'), paymentMethod:'bank', status:'completed', tags:['income','freelance'], isRecurring:false },
  { id:'009', type:'expense', category:'Housing', description:'Monthly apartment rent', amount:1200, date:new Date('2025-06-01'), paymentMethod:'bank', status:'completed', tags:['housing','rent'], isRecurring:true, recurringFrequency:'monthly' },
  { id:'010', type:'expense', category:'Fitness', description:'Gym membership — monthly', amount:49, date:new Date('2025-05-31'), paymentMethod:'card', status:'pending', tags:['fitness','health'], isRecurring:true, recurringFrequency:'monthly' },
];

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly _transactions = signal<Transaction[]>(MOCK_TRANSACTIONS.map(t => new TransactionModel(t)));
  private readonly _filters = signal<TransactionFilters>({
    search: '', type: 'all', status: 'all', dateFrom: null, dateTo: null, categories: [], paymentMethods: [],
  });
  private readonly _pagination = signal<TransactionPagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  readonly filters = computed(() => this._filters());
  readonly pagination = computed(() => this._pagination());

  readonly filteredTransactions = computed(() => {
    const f = this._filters();
    let list = this._transactions();
    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    if (f.type !== 'all') list = list.filter(t => t.type === f.type);
    if (f.status !== 'all') list = list.filter(t => t.status === f.status);
    return list;
  });

  readonly paginatedTransactions = computed(() => {
    const p = this._pagination();
    const all = this.filteredTransactions();
    const start = (p.page - 1) * p.pageSize;
    return all.slice(start, start + p.pageSize);
  });

  readonly recentTransactions = computed(() => this._transactions().slice(0, 5));

  readonly totalStats = computed(() => {
    const txs = this._transactions();
    const income = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    return { income, expense, balance: income - expense };
  });

  updateFilters(partial: Partial<TransactionFilters>): void {
    this._filters.update(f => ({ ...f, ...partial }));
    this._pagination.update(p => ({ ...p, page: 1 }));
  }

  setPage(page: number): void {
    this._pagination.update(p => ({ ...p, page }));
  }

  addTransaction(tx: Partial<Transaction>): void {
    const model = new TransactionModel(tx);
    this._transactions.update(list => [model, ...list]);
  }

  deleteTransaction(id: string): void {
    this._transactions.update(list => list.filter(t => t.id !== id));
  }
}
