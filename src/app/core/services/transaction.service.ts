import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';
import { Transaction, TransactionFilters, TransactionPagination } from '../interfaces/transaction.interface';
import { TransactionModel } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = `${environment.apiUrl}/transactions`;
  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _filters = signal<TransactionFilters>({
    search: '',
    type: 'all',
    status: 'all',
    dateFrom: null,
    dateTo: null,
    categories: [],
    paymentMethods: [],
  });
  private readonly _pagination = signal<TransactionPagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

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

  constructor(private http: HttpClient) {
    this.loadTransactions().subscribe({ error: () => undefined });
  }

  updateFilters(partial: Partial<TransactionFilters>): void {
    this._filters.update(f => ({ ...f, ...partial }));
    this._pagination.update(p => ({ ...p, page: 1 }));
  }

  setPage(page: number): void {
    this._pagination.update(p => ({ ...p, page }));
  }

  loadTransactions(): Observable<Transaction[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<Transaction[]>>(this.apiUrl).pipe(
      map(response => (response.data ?? []).map(t => new TransactionModel(t))),
      tap(transactions => {
        this._transactions.set(transactions);
        this.syncPagination(transactions.length);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.error.set(this.getErrorMessage(err, 'Unable to load transactions.'));
        return throwError(() => err);
      })
    );
  }

  addTransaction(tx: Partial<Transaction>): Observable<Transaction> {
    return this.http.post<ApiResponse<Transaction>>(this.apiUrl, this.toPayload(tx)).pipe(
      map(response => new TransactionModel(response.data)),
      tap(model => {
        this._transactions.update(list => [model, ...list]);
        this.syncPagination(this._transactions().length);
      }),
      catchError(err => {
        this.error.set(this.getErrorMessage(err, 'Unable to save transaction.'));
        return throwError(() => err);
      })
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      tap(() => {
        this._transactions.update(list => list.filter(t => t.id !== id));
        this.syncPagination(this._transactions().length);
      }),
      map(() => void 0),
      catchError(err => {
        this.error.set(this.getErrorMessage(err, 'Unable to delete transaction.'));
        return throwError(() => err);
      })
    );
  }

  private toPayload(tx: Partial<Transaction>): Record<string, unknown> {
    const model = new TransactionModel(tx);
    return {
      ...model,
      date: model.date.toISOString(),
    };
  }

  private syncPagination(total: number): void {
    this._pagination.update(p => ({
      ...p,
      total,
      totalPages: Math.max(1, Math.ceil(total / p.pageSize)),
    }));
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    const maybeHttpError = err as {
      error?: { message?: string } | string;
      message?: string;
    };
    const apiError = maybeHttpError?.error;

    if (typeof apiError === 'string') {
      return apiError;
    }
    if (apiError && typeof apiError === 'object' && apiError.message) {
      return apiError.message;
    }
    if (maybeHttpError?.message) {
      return maybeHttpError.message;
    }
    return fallback;
  }
}
