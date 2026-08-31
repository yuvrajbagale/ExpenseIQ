import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CategoriesService, CategoryType } from '../../core/services/categories.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" searchPlaceholder="Search categories…" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Categories</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Categories</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Category
              </button>
            </div>
          </div>

          <div class="eiq-kpi-grid eiq-kpi-grid--3">
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <span class="eiq-badge eiq-badge--neutral">Overview</span>
              </div>
              <p class="eiq-kpi-card__label">Total Categories</p>
              <p class="eiq-kpi-card__value">{{ categories.overview().totalCategories }}</p>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18L13.5 8.5L8.5 13.5L1 6"/><path d="M17 18H23V12"/></svg>
                </div>
                <span class="eiq-badge eiq-badge--danger">Expense</span>
              </div>
              <p class="eiq-kpi-card__label">Expense Categories</p>
              <p class="eiq-kpi-card__value">{{ categories.overview().expenseCategories }}</p>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6L13.5 15.5L8.5 10.5L1 18"/><path d="M17 6H23V12"/></svg>
                </div>
                <span class="eiq-badge eiq-badge--success">Income</span>
              </div>
              <p class="eiq-kpi-card__label">Income Categories</p>
              <p class="eiq-kpi-card__value">{{ categories.overview().incomeCategories }}</p>
            </div>
          </div>

          <div class="eiq-card eiq-filter-bar">
            <div class="eiq-filter-bar__search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input class="eiq-filter-bar__input" type="text" placeholder="Search categories…" (input)="onSearch($event)" />
            </div>
            <div class="eiq-filter-bar__filters">
              <select class="eiq-select" (change)="onTypeChange($event)">
                <option value="all">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select class="eiq-select">
                <option>Sort By</option>
                <option>Total Spent</option>
                <option>Transactions</option>
                <option>Name</option>
              </select>
            </div>
          </div>

          <div class="cat-grid">
            @for (cat of categories.filteredCategories(); track cat.id) {
              <div class="eiq-card cat-card">
                <div class="cat-card__top">
                  <div class="cat-card__icon" [style.background]="cat.iconBg" [style.color]="cat.iconColor">{{ cat.icon }}</div>
                  <span class="cat-card__txn-count">Transactions<br /><strong>{{ cat.transactions }}</strong></span>
                </div>
                <h3 class="cat-card__name">{{ cat.name }}</h3>
                <span class="eiq-badge" [class]="cat.type === 'income' ? 'eiq-badge--success' : 'eiq-badge--danger'">
                  {{ cat.type === 'income' ? 'Income' : 'Expense' }}
                </span>

                <div class="cat-card__spend">
                  <span class="cat-card__spend-label">{{ cat.type === 'income' ? 'Total Earned' : 'Total Spent' }}</span>
                  <span class="cat-card__spend-amount" [class.eiq-amount--pos]="cat.type === 'income'" [class.eiq-amount--neg]="cat.type === 'expense'">
                    \${{ cat.totalSpent.toLocaleString() }}
                  </span>
                </div>

                <div class="eiq-progress-bar">
                  <div class="eiq-progress-bar__fill" [style.width.%]="Math.min(cat.budgetUsage, 100)"></div>
                </div>
                <span class="cat-card__usage">Budget usage: {{ cat.budgetUsage }}%</span>

                <div class="cat-card__actions">
                  <button class="eiq-icon-btn" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="eiq-icon-btn eiq-icon-btn--danger" title="Delete" (click)="categories.remove(cat.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="eiq-card">
            <div class="eiq-card__header">
              <div>
                <h3 class="eiq-card__title">Category Spending Overview</h3>
                <p class="eiq-card__subtitle">Expense categories ranked by total spend</p>
              </div>
              <span class="eiq-badge eiq-badge--neutral">This Month</span>
            </div>
            <div class="cat-spend-list">
              @for (row of categories.spendingOverview(); track row.name) {
                <div class="cat-spend-row">
                  <span class="cat-spend-row__name">{{ row.name }}</span>
                  <div class="eiq-progress-bar cat-spend-row__bar">
                    <div class="eiq-progress-bar__fill" [style.width.%]="row.percentage" [style.background]="row.color"></div>
                  </div>
                  <span class="cat-spend-row__amount">\${{ row.amount.toLocaleString() }}</span>
                </div>
              }
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .cat-card { display: flex; flex-direction: column; gap: 0.5rem; transition: transform 200ms ease, box-shadow 200ms ease; }
    .cat-card:hover { transform: translateY(-2px); box-shadow: var(--eiq-shadow-md); }
    .cat-card .eiq-progress-bar__fill { background: var(--eiq-primary); }
    .cat-card__top { display: flex; justify-content: space-between; align-items: flex-start; }
    .cat-card__icon { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .cat-card__txn-count { font-size: 0.6875rem; color: var(--eiq-muted); text-align: right; line-height: 1.3; strong { color: var(--eiq-foreground); font-size: 0.8125rem; } }
    .cat-card__name { font-size: 0.9375rem; font-weight: 700; color: var(--eiq-foreground); margin: 0; }
    .cat-card__spend { display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.25rem; }
    .cat-card__spend-label { font-size: 0.75rem; color: var(--eiq-muted); }
    .cat-card__spend-amount { font-size: 1rem; font-weight: 700; }
    .cat-card__usage { font-size: 0.6875rem; color: var(--eiq-muted); }
    .cat-card__actions { display: flex; justify-content: flex-end; gap: 0.25rem; margin-top: 0.25rem; }
    .cat-spend-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .cat-spend-row { display: grid; grid-template-columns: 140px 1fr 80px; align-items: center; gap: 1rem; }
    .cat-spend-row__name { font-size: 0.8125rem; color: var(--eiq-foreground); font-weight: 500; }
    .cat-spend-row__bar { margin: 0; }
    .cat-spend-row__amount { font-size: 0.8125rem; font-weight: 700; color: var(--eiq-foreground); text-align: right; }
  `]
})
export class CategoriesComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly categories  = inject(CategoriesService);
  protected readonly Math = Math;
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.categories.loadCategories().subscribe();
  }

  onSearch(e: Event): void { this.categories.setSearch((e.target as HTMLInputElement).value); }
  onTypeChange(e: Event): void { this.categories.setTypeFilter((e.target as HTMLSelectElement).value as 'all' | CategoryType); }
  goTo(path: string): void { this.router.navigate([path]); }
}
