import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export type GoalStatus = 'on-track' | 'behind' | 'completed';

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution: number;
  status: GoalStatus;
}

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/goals`;

  private readonly _goals = signal<SavingsGoal[]>([]);

  readonly goals = computed(() => this._goals());

  readonly totals = computed(() => {
    const list = this._goals();
    const target = list.reduce((a, g) => a + g.targetAmount, 0);
    const current = list.reduce((a, g) => a + g.currentAmount, 0);
    const completed = list.filter(g => g.status === 'completed').length;
    return { target, current, completed, active: list.length - completed };
  });

  loadGoals(): Observable<void> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        this._goals.set(response.data.goals);
      }),
      catchError(() => of(undefined))
    );
  }

  progress(goal: SavingsGoal): number {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  remove(id: string): void {
    this._goals.update(list => list.filter(g => g.id !== id));
  }
}
