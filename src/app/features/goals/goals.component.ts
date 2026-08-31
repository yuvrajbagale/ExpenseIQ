import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GoalsService } from '../../core/services/goals.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" searchPlaceholder="Search goals…" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Savings Goals</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Goals</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Goal
              </button>
            </div>
          </div>

          <div class="eiq-kpi-grid">
            <div class="eiq-kpi-card">
              <p class="eiq-kpi-card__label">Total Target</p>
              <p class="eiq-kpi-card__value">\${{ goals.totals().target.toLocaleString() }}</p>
            </div>
            <div class="eiq-kpi-card">
              <p class="eiq-kpi-card__label">Total Saved</p>
              <p class="eiq-kpi-card__value eiq-kpi-card__value--success">\${{ goals.totals().current.toLocaleString() }}</p>
            </div>
            <div class="eiq-kpi-card">
              <p class="eiq-kpi-card__label">Active Goals</p>
              <p class="eiq-kpi-card__value">{{ goals.totals().active }}</p>
            </div>
            <div class="eiq-kpi-card">
              <p class="eiq-kpi-card__label">Completed</p>
              <p class="eiq-kpi-card__value eiq-kpi-card__value--success">{{ goals.totals().completed }}</p>
            </div>
          </div>

          <div class="goals-grid">
            @for (goal of goals.goals(); track goal.id) {
              <div class="eiq-card goal-card">
                <div class="goal-card__top">
                  <div class="goal-card__icon" [style.background]="goal.iconBg" [style.color]="goal.iconColor">{{ goal.icon }}</div>
                  <span class="eiq-badge" [class]="statusBadge(goal.status)">{{ statusLabel(goal.status) }}</span>
                </div>
                <h3 class="goal-card__name">{{ goal.name }}</h3>

                <div class="goal-card__amounts">
                  <span class="goal-card__current">\${{ goal.currentAmount.toLocaleString() }}</span>
                  <span class="goal-card__target">of \${{ goal.targetAmount.toLocaleString() }}</span>
                </div>

                <div class="eiq-progress-bar">
                  <div class="eiq-progress-bar__fill" [style.width.%]="goals.progress(goal)" [style.background]="goal.iconColor"></div>
                </div>
                <span class="goal-card__pct">{{ goals.progress(goal) }}% complete</span>

                <div class="goal-card__meta">
                  <span>🗓️ Due {{ goal.deadline }}</span>
                  @if (goal.monthlyContribution > 0) {
                    <span>💰 \${{ goal.monthlyContribution }}/mo</span>
                  }
                </div>

                <div class="goal-card__actions">
                  <button class="eiq-icon-btn" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="eiq-icon-btn eiq-icon-btn--danger" title="Delete" (click)="goals.remove(goal.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .goals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .goal-card { display: flex; flex-direction: column; gap: 0.5rem; transition: transform 200ms ease, box-shadow 200ms ease; }
    .goal-card:hover { transform: translateY(-2px); box-shadow: var(--eiq-shadow-md); }
    .goal-card__top { display: flex; justify-content: space-between; align-items: flex-start; }
    .goal-card__icon { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .goal-card__name { font-size: 0.9375rem; font-weight: 700; color: var(--eiq-foreground); margin: 0; }
    .goal-card__amounts { display: flex; align-items: baseline; gap: 0.375rem; }
    .goal-card__current { font-size: 1.25rem; font-weight: 700; color: var(--eiq-foreground); }
    .goal-card__target { font-size: 0.75rem; color: var(--eiq-muted); }
    .goal-card__pct { font-size: 0.6875rem; color: var(--eiq-muted); }
    .goal-card__meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--eiq-muted); margin-top: 0.25rem; }
    .goal-card__actions { display: flex; justify-content: flex-end; gap: 0.25rem; margin-top: 0.25rem; }
  `]
})
export class GoalsComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly goals = inject(GoalsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.goals.loadGoals().subscribe();
  }

  statusLabel(status: string): string {
    return { 'on-track': 'On Track', behind: 'Behind', completed: 'Completed' }[status] ?? status;
  }

  statusBadge(status: string): string {
    return { 'on-track': 'eiq-badge--success', behind: 'eiq-badge--warning', completed: 'eiq-badge--neutral' }[status] ?? 'eiq-badge--neutral';
  }

  goTo(path: string): void { this.router.navigate([path]); }
}
