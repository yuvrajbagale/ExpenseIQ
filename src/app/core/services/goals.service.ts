import { Injectable, computed, signal } from '@angular/core';

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

const GOALS: SavingsGoal[] = [
  { id: 'emergency', name: 'Emergency Fund',     icon: '🛟', iconBg: '#dbeafe', iconColor: '#2b7fff', targetAmount: 10000, currentAmount: 6200, deadline: 'Dec 2025', monthlyContribution: 400, status: 'on-track'  },
  { id: 'vacation',  name: 'Vacation to Japan',  icon: '✈️', iconBg: '#fce7f3', iconColor: '#db2777', targetAmount: 4500,  currentAmount: 1800, deadline: 'Aug 2025', monthlyContribution: 300, status: 'behind'    },
  { id: 'car',        name: 'New Car Down Payment', icon: '🚗', iconBg: '#dcfce7', iconColor: '#16a34a', targetAmount: 8000, currentAmount: 8000, deadline: 'May 2025', monthlyContribution: 0,   status: 'completed' },
  { id: 'laptop',     name: 'New Laptop',        icon: '💻', iconBg: '#fef3c7', iconColor: '#d97706', targetAmount: 1800,  currentAmount: 950,  deadline: 'Sep 2025', monthlyContribution: 150, status: 'on-track'  },
  { id: 'wedding',    name: 'Wedding Fund',      icon: '💍', iconBg: '#f3e8ff', iconColor: '#9333ea', targetAmount: 15000, currentAmount: 4200, deadline: 'Jun 2026', monthlyContribution: 500, status: 'behind'    },
];

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly _goals = signal<SavingsGoal[]>(GOALS);
  readonly goals = computed(() => this._goals());

  readonly totals = computed(() => {
    const list = this._goals();
    const target  = list.reduce((a, g) => a + g.targetAmount, 0);
    const current = list.reduce((a, g) => a + g.currentAmount, 0);
    const completed = list.filter(g => g.status === 'completed').length;
    return { target, current, completed, active: list.length - completed };
  });

  progress(goal: SavingsGoal): number {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  remove(id: string): void {
    this._goals.update(list => list.filter(g => g.id !== id));
  }
}
