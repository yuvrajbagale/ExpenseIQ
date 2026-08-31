import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';
import { Transaction, TransactionFilters, TransactionPagination } from '../interfaces/transaction.interface';
import { TransactionModel } from '../models/transaction.model';

interface PaginatedResponse {
  transactions: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

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
    pageSize: 100,
    total: 0,
    totalPages: 0,
  });

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = computed(() => this._filters());
  readonly pagination = computed(() => this._pagination());

  /** Server-side filtered & paginated transactions — used by the transactions table. */
  readonly filteredTransactions = computed(() => this._transactions());

  /** Client-side pagination slice — kept for backward compatibility. */
  readonly paginatedTransactions = computed(() => {
    const p = this._pagination();
    const all = this._transactions();
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
    // Reload from server with new filters
    this.loadTransactions().subscribe({ error: () => undefined });
  }

  setPage(page: number): void {
    this._pagination.update(p => ({ ...p, page }));
    this.loadTransactions().subscribe({ error: () => undefined });
  }

  loadTransactions(): Observable<Transaction[]> {
    this.isLoading.set(true);
    this.error.set(null);

    const f = this._filters();
    const p = this._pagination();

    let params = new HttpParams()
      .set('page', p.page.toString())
      .set('pageSize', p.pageSize.toString())
      .set('sortBy', 'date')
      .set('sortOrder', 'desc');

    if (f.search) params = params.set('search', f.search);
    if (f.type !== 'all') params = params.set('type', f.type);
    if (f.status !== 'all') params = params.set('status', f.status);

    return this.http.get<ApiResponse<PaginatedResponse>>(this.apiUrl, {
      params,
      withCredentials: true,
    }).pipe(
      map(response => {
        const data = response.data;
        // Update pagination from server response
        this._pagination.set({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
        return (data.transactions ?? []).map(t => new TransactionModel(t));
      }),
      tap(transactions => {
        this._transactions.set(transactions);
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
    return this.http.post<ApiResponse<Transaction>>(this.apiUrl, this.toPayload(tx), {
      withCredentials: true,
    }).pipe(
      map(response => new TransactionModel(response.data)),
      tap(model => {
        this._transactions.update(list => [model, ...list]);
        this._pagination.update(p => ({ ...p, total: p.total + 1 }));
      }),
      catchError(err => {
        this.error.set(this.getErrorMessage(err, 'Unable to save transaction.'));
        return throwError(() => err);
      })
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.apiUrl}/${encodeURIComponent(id)}`, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        this._transactions.update(list => list.filter(t => t.id !== id));
        this._pagination.update(p => ({ ...p, total: Math.max(0, p.total - 1) }));
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
