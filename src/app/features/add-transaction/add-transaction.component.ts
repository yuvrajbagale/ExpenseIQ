import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';
import { PaymentMethod, RecurringFrequency, TransactionType } from '../../core/interfaces/transaction.interface';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" />
        <main class="eiq-content">

          <!-- Page Header -->
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Add Transaction</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" [routerLink]="'/dashboard'">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Add Transaction</span>
              </nav>
            </div>
          </div>

          <div class="add-txn-layout">
            <!-- Main Form Card -->
            <div class="eiq-card add-txn-card">
              <div class="add-txn-card__header">
                <h2 class="add-txn-card__title">New Transaction</h2>
                <p class="add-txn-card__sub">Fill in the details below to record a transaction</p>
              </div>

              <div class="add-txn-card__body">
                <!-- Type Toggle -->
                <div class="field-group">
                  <label class="field-label">Transaction Type</label>
                  <div class="type-toggle">
                    <button class="type-btn" [class.type-btn--active]="txnType()==='expense'" (click)="txnType.set('expense')">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                      Expense
                    </button>
                    <button class="type-btn type-btn--income" [class.type-btn--active]="txnType()==='income'" (click)="txnType.set('income')">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                      Income
                    </button>
                  </div>
                </div>

                <!-- Amount -->
                <div class="field-group">
                  <label class="field-label">Amount</label>
                  <div class="amount-input-wrap">
                    <span class="amount-currency">$</span>
                    <input class="amount-input" type="number" [(ngModel)]="amount" placeholder="0.00" min="0" step="0.01" />
                    <span class="amount-type-badge" [class.amount-type-badge--income]="txnType()==='income'">
                      {{ txnType() | titlecase }}
                    </span>
                  </div>
                </div>

                <div class="field-grid">
                  <!-- Category -->
                  <div class="field-group">
                    <label class="field-label">Category</label>
                    <div class="select-wrap">
                      <select class="eiq-select eiq-select--full" [(ngModel)]="category">
                        <option value="">🍔 Food &amp; Dining</option>
                        <option value="transport">🚗 Transport</option>
                        <option value="shopping">🛍️ Shopping</option>
                        <option value="health">💊 Health</option>
                        <option value="entertainment">🎬 Entertainment</option>
                        <option value="housing">🏠 Housing</option>
                        <option value="education">📚 Education</option>
                        <option value="salary">💼 Salary</option>
                        <option value="freelance">💻 Freelance</option>
                      </select>
                      <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div class="cat-chips">
                      <span class="cat-chip cat-chip--orange">🍔 Food</span>
                      <span class="cat-chip cat-chip--blue">🚗 Transport</span>
                      <span class="cat-chip cat-chip--teal">💊 Health</span>
                    </div>
                  </div>

                  <!-- Sub-Category -->
                  <div class="field-group">
                    <label class="field-label">Sub-Category</label>
                    <div class="select-wrap">
                      <select class="eiq-select eiq-select--full" [(ngModel)]="subCategory">
                        <option>Restaurant</option>
                        <option>Groceries</option>
                        <option>Fast Food</option>
                        <option>Coffee</option>
                        <option>Delivery</option>
                      </select>
                      <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  <!-- Wallet -->
                  <div class="field-group">
                    <label class="field-label">Wallet</label>
                    <div class="wallet-btns">
                      @for (w of walletOptions; track w.value) {
                        <button class="wallet-btn" [class.wallet-btn--active]="wallet()===w.value" (click)="wallet.set(w.value)">
                          <span [innerHTML]="w.icon"></span>
                          {{ w.label }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Date -->
                  <div class="field-group">
                    <label class="field-label">Date</label>
                    <div class="input-icon-wrap">
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <input class="eiq-input eiq-input--icon" type="date" [(ngModel)]="txnDate" />
                    </div>
                  </div>

                  <!-- Time -->
                  <div class="field-group">
                    <label class="field-label">Time</label>
                    <div class="input-icon-wrap">
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <input class="eiq-input eiq-input--icon" type="time" [(ngModel)]="txnTime" />
                    </div>
                  </div>

                  <!-- Payment Method -->
                  <div class="field-group field-group--full">
                    <label class="field-label">Payment Method</label>
                    <div class="payment-methods">
                      @for (pm of paymentMethods; track pm.value) {
                        <label class="pm-option">
                          <div class="pm-radio" [class.pm-radio--active]="paymentMethod()===pm.value" (click)="paymentMethod.set(pm.value)">
                            @if (paymentMethod()===pm.value) { <div class="pm-radio__dot"></div> }
                          </div>
                          <span [class.pm-label--active]="paymentMethod()===pm.value" class="pm-label">{{ pm.label }}</span>
                        </label>
                      }
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <div class="field-group">
                  <label class="field-label">Description</label>
                  <textarea class="eiq-textarea" [(ngModel)]="description" rows="3" placeholder="Add a note about this transaction…"></textarea>
                </div>

                <!-- Tags -->
                <div class="field-group">
                  <label class="field-label">Tags</label>
                  <div class="tag-input-box">
                    @for (tag of tags(); track tag) {
                      <span class="tag-chip">
                        {{ tag }}
                        <button class="tag-chip__remove" (click)="removeTag(tag)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    }
                    <input class="tag-input" [(ngModel)]="tagInput" placeholder="Add tag…" (keydown.enter)="addTag()" />
                  </div>
                </div>

                <!-- Location -->
                <div class="field-group">
                  <label class="field-label">Location</label>
                  <div class="input-icon-wrap">
                    <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <input class="eiq-input eiq-input--icon" [(ngModel)]="location" placeholder="Enter location or place name…" />
                  </div>
                </div>

                <!-- Receipt Upload -->
                <div class="field-group">
                  <label class="field-label">Receipt</label>
                  <div class="upload-zone">
                    <div class="upload-zone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <p class="upload-zone__title">Drag &amp; drop or click to upload</p>
                    <p class="upload-zone__sub">Supports JPG, PNG, PDF up to 10MB</p>
                    <button class="upload-zone__btn" type="button">Browse Files</button>
                  </div>
                </div>

                <!-- Recurring -->
                <div class="recurring-row">
                  <div class="recurring-row__left">
                    <div class="recurring-row__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    </div>
                    <div>
                      <p class="recurring-row__title">Mark as Recurring</p>
                      <p class="recurring-row__sub">Automatically repeat this transaction</p>
                    </div>
                  </div>
                  <div class="recurring-row__right">
                    <button class="toggle-btn" [class.toggle-btn--on]="isRecurring()" (click)="isRecurring.update(v=>!v)">
                      <div class="toggle-btn__thumb"></div>
                    </button>
                    @if (isRecurring()) {
                      <div class="select-wrap">
                        <select class="eiq-select" [(ngModel)]="recurringFreq">
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="daily">Daily</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    }
                  </div>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                  <button class="eiq-btn eiq-btn--outline" [routerLink]="'/transactions'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Cancel
                  </button>
                  <div class="form-actions__right">
                    <button class="eiq-btn eiq-btn--ghost" (click)="resetForm()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.72L1 10"/></svg>
                      Reset
                    </button>
                    <button class="eiq-btn eiq-btn--primary eiq-btn--save" (click)="saveTransaction()" [disabled]="isSaving()">
                      @if (isSaving()) {
                        <span class="eiq-spinner"></span> Saving…
                      } @else {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save Transaction
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Stats Panel -->
            <div class="add-txn-sidebar">
              <div class="eiq-card quick-stat-card">
                <h3 class="quick-stat-card__title">This Month</h3>
                <div class="quick-stats">
                  <div class="quick-stat">
                    <p class="quick-stat__label">Income</p>
                    <p class="quick-stat__value quick-stat__value--pos">$5,200.00</p>
                  </div>
                  <div class="quick-stat">
                    <p class="quick-stat__label">Expenses</p>
                    <p class="quick-stat__value quick-stat__value--neg">$3,180.50</p>
                  </div>
                  <div class="quick-stat quick-stat--bordered">
                    <p class="quick-stat__label">Net</p>
                    <p class="quick-stat__value quick-stat__value--pos">$2,019.50</p>
                  </div>
                </div>
              </div>

              <div class="eiq-card recent-cat-card">
                <h3 class="recent-cat-card__title">Recent Categories</h3>
                <div class="recent-cats">
                  @for (rc of recentCats; track rc.label) {
                    <div class="recent-cat">
                      <div class="recent-cat__left">
                        <span class="recent-cat__emoji">{{ rc.emoji }}</span>
                        <span class="recent-cat__name">{{ rc.label }}</span>
                      </div>
                      <span class="recent-cat__amount">{{ rc.amount }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .add-txn-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }
    .add-txn-card { padding: 0; overflow: hidden; }
    .add-txn-card__header { padding: 1.5rem 1.5rem 0; border-bottom: 1px solid oklch(0.92 0.004 286.32); padding-bottom: 1rem; margin-bottom: 0; }
    .add-txn-card__title { font-size: 1.125rem; font-weight: 700; color: oklch(0.141 0.005 285.823); margin: 0 0 0.25rem; }
    .add-txn-card__sub { font-size: 0.75rem; color: oklch(0.552 0.016 285.938); margin: 0; }
    .add-txn-card__body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

    /* Field Groups */
    .field-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .field-group--full { grid-column: 1 / -1; }
    .field-label { font-size: 0.6875rem; font-weight: 700; color: oklch(0.552 0.016 285.938); text-transform: uppercase; letter-spacing: 0.08em; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 1.5rem; }

    /* Type Toggle */
    .type-toggle { display: flex; gap: 0.75rem; }
    .type-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600;
      border: 2px solid oklch(0.92 0.004 286.32); color: oklch(0.552 0.016 285.938);
      cursor: pointer; transition: all 0.15s; background: white;
      svg { width: 1rem; height: 1rem; }
      &.type-btn--active { border-color: oklch(0.577 0.245 27.325); background: oklch(0.577 0.245 27.325 / 0.08); color: oklch(0.577 0.245 27.325); }
    }
    .type-btn--income.type-btn--active { border-color: oklch(0.6 0.118 184.704); background: oklch(0.6 0.118 184.704 / 0.08); color: oklch(0.6 0.118 184.704); }

    /* Amount Input */
    .amount-input-wrap { display: flex; align-items: center; background: oklch(0.967 0.001 286.375); border: 2px solid oklch(0.92 0.004 286.32); border-radius: 1rem; overflow: hidden; height: 4rem; }
    .amount-currency { padding: 0 1rem; font-size: 1.5rem; font-weight: 700; color: oklch(0.552 0.016 285.938); }
    .amount-input { flex: 1; background: none; border: none; outline: none; font-size: 1.5rem; font-weight: 700; color: oklch(0.141 0.005 285.823); padding: 0; }
    .amount-type-badge { padding: 0.25rem 0.75rem; margin: 0.5rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600; background: oklch(0.577 0.245 27.325 / 0.12); color: oklch(0.577 0.245 27.325); white-space: nowrap; }
    .amount-type-badge--income { background: oklch(0.6 0.118 184.704 / 0.12); color: oklch(0.6 0.118 184.704); }

    /* Select */
    .select-wrap { position: relative; }
    .select-arrow { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; width: 1rem; height: 1rem; color: oklch(0.552 0.016 285.938); }
    .eiq-select--full { width: 100%; }

    /* Category chips */
    .cat-chips { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .cat-chip { font-size: 0.6875rem; font-weight: 500; border-radius: 9999px; padding: 0.25rem 0.5rem; border: 1px solid; cursor: pointer; }
    .cat-chip--orange { background: oklch(0.646 0.222 41.116 / 0.12); color: oklch(0.646 0.222 41.116); border-color: oklch(0.646 0.222 41.116 / 0.2); }
    .cat-chip--blue   { background: oklch(0.623 0.214 259.815 / 0.1);  color: oklch(0.623 0.214 259.815);  border-color: oklch(0.623 0.214 259.815 / 0.2); }
    .cat-chip--teal   { background: oklch(0.6 0.118 184.704 / 0.12);   color: oklch(0.6 0.118 184.704);    border-color: oklch(0.6 0.118 184.704 / 0.2); }

    /* Wallet Buttons */
    .wallet-btns { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .wallet-btn {
      display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem;
      border-radius: 0.75rem; font-size: 0.75rem; font-weight: 500;
      border: 1px solid oklch(0.92 0.004 286.32); color: oklch(0.552 0.016 285.938);
      background: white; cursor: pointer; transition: all 0.15s;
      svg { width: 0.875rem; height: 0.875rem; }
      &.wallet-btn--active { border-width: 2px; border-color: #2b7fff; background: rgba(43,127,255,0.08); color: #2b7fff; font-weight: 600; }
    }

    /* Payment Methods */
    .payment-methods { display: flex; flex-wrap: wrap; gap: 1rem; }
    .pm-option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .pm-radio { width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid oklch(0.92 0.004 286.32); display: flex; align-items: center; justify-content: center; cursor: pointer; &.pm-radio--active { border-color: #2b7fff; } }
    .pm-radio__dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #2b7fff; }
    .pm-label { font-size: 0.875rem; color: oklch(0.552 0.016 285.938); &.pm-label--active { font-weight: 600; color: oklch(0.141 0.005 285.823); } }

    /* Input with icon */
    .input-icon-wrap { position: relative; }
    .input-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: oklch(0.552 0.016 285.938); pointer-events: none; }
    .eiq-input { width: 100%; border: 1px solid oklch(0.92 0.004 286.32); background: white; border-radius: 0.75rem; font-size: 0.875rem; color: oklch(0.141 0.005 285.823); padding: 0.75rem 1rem; outline: none; &:focus { border-color: #2b7fff; box-shadow: 0 0 0 3px rgba(43,127,255,0.12); } }
    .eiq-input--icon { padding-left: 2.5rem; }
    .eiq-textarea { width: 100%; border: 1px solid oklch(0.92 0.004 286.32); background: white; border-radius: 0.75rem; font-size: 0.875rem; color: oklch(0.141 0.005 285.823); padding: 0.75rem 1rem; outline: none; resize: vertical; &:focus { border-color: #2b7fff; box-shadow: 0 0 0 3px rgba(43,127,255,0.12); } }

    /* Tags */
    .tag-input-box { min-height: 3rem; border: 1px solid oklch(0.92 0.004 286.32); border-radius: 0.75rem; padding: 0.5rem 0.75rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; background: white; &:focus-within { border-color: #2b7fff; } }
    .tag-chip { display: flex; align-items: center; gap: 0.25rem; background: rgba(43,127,255,0.1); color: #2b7fff; border: 1px solid rgba(43,127,255,0.2); border-radius: 9999px; font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.625rem; }
    .tag-chip__remove { background: none; border: none; cursor: pointer; color: inherit; display: flex; padding: 0; svg { width: 0.75rem; height: 0.75rem; } }
    .tag-input { flex: 1; min-width: 5rem; background: none; border: none; outline: none; font-size: 0.875rem; color: oklch(0.141 0.005 285.823); &::placeholder { color: oklch(0.552 0.016 285.938); } }

    /* Upload Zone */
    .upload-zone { border: 2px dashed rgba(43,127,255,0.35); background: rgba(43,127,255,0.03); border-radius: 0.75rem; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.15s; &:hover { background: rgba(43,127,255,0.06); } }
    .upload-zone__icon { width: 3rem; height: 3rem; background: rgba(43,127,255,0.1); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; svg { width: 1.25rem; height: 1.25rem; color: #2b7fff; } }
    .upload-zone__title { font-size: 0.875rem; font-weight: 600; color: oklch(0.141 0.005 285.823); margin: 0; }
    .upload-zone__sub { font-size: 0.75rem; color: oklch(0.552 0.016 285.938); margin: 0; }
    .upload-zone__btn { font-size: 0.75rem; font-weight: 600; color: #2b7fff; border: 1px solid #2b7fff; background: none; border-radius: 0.5rem; padding: 0.375rem 1rem; cursor: pointer; }

    /* Recurring Row */
    .recurring-row { display: flex; align-items: center; justify-content: space-between; background: oklch(0.967 0.001 286.375 / 0.5); border: 1px solid oklch(0.92 0.004 286.32); border-radius: 0.75rem; padding: 0.75rem 1rem; }
    .recurring-row__left { display: flex; align-items: center; gap: 0.75rem; }
    .recurring-row__icon { width: 2rem; height: 2rem; background: rgba(43,127,255,0.1); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; svg { width: 1rem; height: 1rem; color: #2b7fff; } }
    .recurring-row__title { font-size: 0.875rem; font-weight: 600; color: oklch(0.141 0.005 285.823); margin: 0 0 0.125rem; }
    .recurring-row__sub { font-size: 0.75rem; color: oklch(0.552 0.016 285.938); margin: 0; }
    .recurring-row__right { display: flex; align-items: center; gap: 0.75rem; }
    .toggle-btn { position: relative; width: 2.75rem; height: 1.5rem; background: oklch(0.92 0.004 286.32); border-radius: 9999px; border: none; cursor: pointer; transition: background 0.2s; &.toggle-btn--on { background: #2b7fff; } }
    .toggle-btn__thumb { position: absolute; top: 0.125rem; left: 0.125rem; width: 1.25rem; height: 1.25rem; background: white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s; }
    .toggle-btn--on .toggle-btn__thumb { transform: translateX(1.25rem); }

    /* Form Actions */
    .form-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; border-top: 1px solid oklch(0.92 0.004 286.32); }
    .form-actions__right { display: flex; gap: 0.75rem; }
    .eiq-btn--save { padding: 0.75rem 2rem; }

    /* Sidebar Quick Stats */
    .add-txn-sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .quick-stat-card { padding: 1.25rem; }
    .quick-stat-card__title { font-size: 0.875rem; font-weight: 700; color: oklch(0.141 0.005 285.823); margin: 0 0 1rem; }
    .quick-stats { display: flex; flex-direction: column; gap: 0.75rem; }
    .quick-stat { }
    .quick-stat--bordered { border-top: 1px solid oklch(0.92 0.004 286.32); padding-top: 0.75rem; }
    .quick-stat__label { font-size: 0.75rem; color: oklch(0.552 0.016 285.938); margin: 0 0 0.25rem; }
    .quick-stat__value { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .quick-stat__value--pos { color: oklch(0.6 0.118 184.704); }
    .quick-stat__value--neg { color: oklch(0.577 0.245 27.325); }
    .recent-cat-card { padding: 1.25rem; }
    .recent-cat-card__title { font-size: 0.875rem; font-weight: 700; color: oklch(0.141 0.005 285.823); margin: 0 0 1rem; }
    .recent-cats { display: flex; flex-direction: column; gap: 0.75rem; }
    .recent-cat { display: flex; justify-content: space-between; align-items: center; }
    .recent-cat__left { display: flex; align-items: center; gap: 0.5rem; }
    .recent-cat__emoji { font-size: 1rem; }
    .recent-cat__name { font-size: 0.875rem; color: oklch(0.141 0.005 285.823); font-weight: 500; }
    .recent-cat__amount { font-size: 0.875rem; font-weight: 600; color: oklch(0.577 0.245 27.325); }
    .eiq-spinner { display: inline-block; width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AddTransactionComponent {
  protected readonly authService  = inject(AuthService);
  protected readonly txnService   = inject(TransactionService);
  private   readonly router       = inject(Router);

  // Form state using signals
  txnType        = signal<TransactionType>('expense');
  amount         = 0;
  category       = '';
  subCategory    = 'Restaurant';
  wallet         = signal<PaymentMethod>('cash');
  txnDate        = new Date().toISOString().split('T')[0];
  txnTime        = '12:30';
  paymentMethod  = signal<PaymentMethod>('cash');
  description    = '';
  tags           = signal<string[]>(['lunch', 'work', 'weekday']);
  tagInput       = '';
  location       = '';
  isRecurring    = signal(true);
  recurringFreq  = 'monthly' as RecurringFrequency;
  isSaving       = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',       route: '/dashboard',       icon: 'dashboard',              exact: true },
    { label: 'Transactions',    route: '/transactions',    icon: 'swap_horiz'                           },
    { label: 'Add Transaction', route: '/add-transaction', icon: 'add_circle'                           },
    { label: 'Categories',      route: '/categories',      icon: 'label'                                },
    { label: 'Budget',          route: '/budget',          icon: 'pie_chart'                            },
    { label: 'Analytics',       route: '/analytics',       icon: 'trending_up'                          },
    { label: 'Reports',         route: '/reports',         icon: 'description'                          },
    { label: 'Goals',           route: '/goals',           icon: 'flag'                                 },
    { label: 'Calendar',        route: '/calendar',        icon: 'calendar_month'                       },
    { label: 'Wallet Accounts', route: '/accounts',        icon: 'account_balance_wallet'               },
    { label: 'Recurring',       route: '/recurring',       icon: 'autorenew'                            },
  ];

  walletOptions = [
    { value: 'cash' as PaymentMethod, label: 'Cash',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>' },
    { value: 'bank' as PaymentMethod, label: 'Bank',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>' },
    { value: 'card' as PaymentMethod, label: 'Card',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
    { value: 'upi'  as PaymentMethod, label: 'UPI',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>' },
  ];

  paymentMethods = [
    { value: 'cash' as PaymentMethod, label: 'Cash'          },
    { value: 'card' as PaymentMethod, label: 'Card'          },
    { value: 'upi'  as PaymentMethod, label: 'UPI'           },
    { value: 'bank' as PaymentMethod, label: 'Bank Transfer' },
  ];

  recentCats = [
    { emoji: '🍔', label: 'Food & Dining', amount: '-$84.50'  },
    { emoji: '⚡', label: 'Utilities',      amount: '-$120.00' },
    { emoji: '🚗', label: 'Transport',      amount: '-$18.75'  },
    { emoji: '🎬', label: 'Entertainment',  amount: '-$15.99'  },
  ];

  addTag(): void {
    const t = this.tagInput.trim();
    if (t && !this.tags().includes(t)) this.tags.update(ts => [...ts, t]);
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tags.update(ts => ts.filter(t => t !== tag));
  }

  resetForm(): void {
    this.txnType.set('expense'); this.amount = 0; this.category = '';
    this.subCategory = 'Restaurant'; this.wallet.set('cash');
    this.txnDate = new Date().toISOString().split('T')[0]; this.txnTime = '12:30';
    this.paymentMethod.set('cash'); this.description = '';
    this.tags.set([]); this.tagInput = ''; this.location = '';
    this.isRecurring.set(false);
  }

  async saveTransaction(): Promise<void> {
    if (!this.amount || this.amount <= 0) return;
    this.isSaving.set(true);
    await new Promise(r => setTimeout(r, 600));
    this.txnService.addTransaction({
      type: this.txnType(), category: this.category || 'Food',
      description: this.description || 'New transaction',
      amount: this.amount, date: new Date(this.txnDate),
      paymentMethod: this.paymentMethod(), status: 'completed',
      tags: this.tags(), location: this.location,
      isRecurring: this.isRecurring(),
      recurringFrequency: this.isRecurring() ? this.recurringFreq : undefined,
    });
    this.isSaving.set(false);
    this.router.navigate(['/transactions']);
  }
}
