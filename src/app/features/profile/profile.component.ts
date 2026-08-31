import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { GoalsService } from '../../core/services/goals.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { NAV_ITEMS } from '../../shared/constants/nav-items';
import { HeaderComponent } from '../../shared/components/header.component';

interface ProfileField {
  label: string;
  value: string;
  verified?: boolean;
}

interface CompletionItem {
  label: string;
  done: boolean;
}

interface StatItem {
  label: string;
  value: string;
  icon: 'transactions' | 'savings' | 'goals';
}

interface FinancialStat {
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'info' | 'purple';
}

interface ActivityItem {
  text: string;
  time: string;
  tone: 'neutral' | 'success' | 'info';
}

interface ConnectedAccount {
  name: string;
  status: 'Active' | 'Inactive';
}

interface Achievement {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="onLogout()" />
      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="0"
          searchPlaceholder="Search transactions, categories…" />
        <main class="eiq-content">

          <!-- Page Header -->
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Profile</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span class="eiq-breadcrumb__active">Profile</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button type="button" class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="toggleEdit()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {{ editing() ? 'Save Profile' : 'Edit Profile' }}
              </button>
            </div>
          </div>

          <!-- Profile Header Card -->
          <div class="profile-hero">
            <div class="profile-hero__bg"></div>
            <div class="profile-hero__content">
              <div class="profile-hero__avatar">
                {{ user()?.initials ?? 'JD' }}
              </div>
              <div class="profile-hero__meta">
                <div class="profile-hero__name-row">
                  <h2 class="profile-hero__name">{{ displayName() }}</h2>
                  <span class="profile-hero__badge">Premium Member</span>
                </div>
                <p class="profile-hero__email">{{ user()?.email ?? '—' }}</p>
                <p class="profile-hero__since">Member since {{ memberSince() }}</p>
              </div>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="profile-stats">
            @for (stat of stats(); track stat.label) {
              <div class="profile-stat">
                <div class="profile-stat__icon" [class]="'profile-stat__icon--' + stat.icon">
                  @switch (stat.icon) {
                    @case ('transactions') {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    }
                    @case ('savings') {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    }
                    @case ('goals') {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                    }
                  }
                </div>
                <div class="profile-stat__body">
                  <p class="profile-stat__label">{{ stat.label }}</p>
                  <p class="profile-stat__value">{{ stat.value }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Main Grid -->
          <div class="profile-grid">
            <!-- Personal Information -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Personal Information</h3>
                  <p class="eiq-card__subtitle">Your account details</p>
                </div>
              </div>
              <div class="profile-fields">
                @for (field of personalFields(); track field.label) {
                  <div class="profile-field">
                    <span class="profile-field__label">{{ field.label }}</span>
                    <div class="profile-field__value-row">
                      <span class="profile-field__value">{{ field.value }}</span>
                      @if (field.verified) {
                        <svg class="profile-field__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Profile Completion -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Profile Completion</h3>
                  <p class="eiq-card__subtitle">Complete your setup</p>
                </div>
              </div>
              <div class="profile-completion">
                <div class="profile-completion__ring">
                  <svg width="84" height="84" viewBox="0 0 84 84">
                    <circle cx="42" cy="42" r="36" fill="none" stroke="var(--eiq-hover)" stroke-width="8" />
                    <circle
                      cx="42" cy="42" r="36" fill="none"
                      stroke="var(--eiq-primary)" stroke-width="8"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="ringDash()"
                      [attr.stroke-dashoffset]="ringOffset()"
                      transform="rotate(-90 42 42)" />
                  </svg>
                  <span class="profile-completion__pct">{{ completionPct() }}%</span>
                </div>
                <ul class="profile-completion__list">
                  @for (item of completionItems(); track item.label) {
                    <li class="profile-completion__item" [class.profile-completion__item--done]="item.done">
                      <span class="profile-completion__check">
                        @if (item.done) {
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        } @else {
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        }
                      </span>
                      <span class="profile-completion__label">{{ item.label }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>

            <!-- Financial Overview -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Financial Overview</h3>
                  <p class="eiq-card__subtitle">Your money at a glance</p>
                </div>
              </div>
              <div class="profile-fin">
                @for (fin of financialStats(); track fin.label) {
                  <div class="profile-fin__row">
                    <span class="profile-fin__label">{{ fin.label }}</span>
                    <div class="profile-fin__right">
                      <span class="profile-fin__value">{{ fin.value }}</span>
                      <span class="profile-fin__dot" [class]="'profile-fin__dot--' + fin.tone"></span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Recent Activity</h3>
                  <p class="eiq-card__subtitle">Latest actions on your account</p>
                </div>
              </div>
              <ul class="profile-activity">
                @for (act of recentActivity(); track act.text) {
                  <li class="profile-activity__item" [class]="'profile-activity__item--' + act.tone">
                    <span class="profile-activity__bullet"></span>
                    <div class="profile-activity__body">
                      <p class="profile-activity__text">{{ act.text }}</p>
                      <p class="profile-activity__time">{{ act.time }}</p>
                    </div>
                  </li>
                }
              </ul>
            </div>

            <!-- Connected Accounts -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Connected Accounts</h3>
                  <p class="eiq-card__subtitle">Linked payment providers</p>
                </div>
              </div>
              <ul class="profile-accounts">
                @for (acc of connectedAccounts(); track acc.name) {
                  <li class="profile-account">
                    <div class="profile-account__info">
                      <span class="profile-account__name">{{ acc.name }}</span>
                      <span class="profile-account__status" [class.profile-account__status--active]="acc.status === 'Active'">
                        {{ acc.status }}
                      </span>
                    </div>
                    @if (acc.status === 'Active') {
                      <button type="button" class="profile-account__action" (click)="disconnect(acc.name)">Unlink</button>
                    } @else {
                      <button type="button" class="profile-account__action profile-account__action--primary" (click)="connect(acc.name)">Connect</button>
                    }
                  </li>
                }
              </ul>
            </div>

            <!-- Achievements -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Achievements</h3>
                  <p class="eiq-card__subtitle">Badges you've earned</p>
                </div>
              </div>
              <div class="profile-achievements">
                @for (ach of achievements(); track ach.label) {
                  <div class="profile-achievement">
                    <span class="profile-achievement__icon">{{ ach.icon }}</span>
                    <span class="profile-achievement__label">{{ ach.label }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Hero header card ── */
    .profile-hero {
      position: relative;
      border-radius: var(--eiq-radius-lg);
      overflow: hidden;
      border: 1px solid var(--eiq-border);
      box-shadow: var(--eiq-shadow);
    }
    .profile-hero__bg {
      height: 84px;
      background: linear-gradient(135deg, var(--eiq-primary), oklch(0.45 0.18 259.815));
    }
    .profile-hero__content {
      display: flex;
      gap: 1.25rem;
      align-items: flex-end;
      padding: 0 1.5rem 1.25rem;
      margin-top: -42px;
      position: relative;
    }
    .profile-hero__avatar {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--eiq-primary), oklch(0.45 0.18 259.815));
      color: #fff;
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid var(--eiq-surface);
      flex-shrink: 0;
      box-shadow: var(--eiq-shadow-md);
    }
    .profile-hero__meta {
      padding-bottom: 0.25rem;
      min-width: 0;
    }
    .profile-hero__name-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .profile-hero__name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--eiq-foreground);
      line-height: 1.3;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .profile-hero__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      min-height: 1.5rem;
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0;
      white-space: nowrap;
      color: var(--eiq-orange);
      background: var(--eiq-amber-15);
      border: 1px solid var(--eiq-orange-30);
      border-radius: 9999px;
      padding: 0.25rem 0.7rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }
    .profile-hero__email {
      font-size: 0.8125rem;
      color: var(--eiq-muted);
      margin: 0.25rem 0 0;
    }
    .profile-hero__since {
      font-size: 0.75rem;
      color: var(--eiq-subtle);
      margin: 0.125rem 0 0;
    }

    /* ── Stats row ── */
    .profile-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .profile-stat {
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border);
      border-radius: var(--eiq-radius-lg);
      box-shadow: var(--eiq-shadow-sm);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.875rem;
      transition: box-shadow 150ms ease, transform 150ms ease;
    }
    .profile-stat:hover {
      box-shadow: var(--eiq-shadow-md);
      transform: translateY(-2px);
    }
    .profile-stat__icon {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .profile-stat__icon--transactions { background: var(--eiq-primary-10); color: var(--eiq-primary); }
    .profile-stat__icon--savings { background: var(--eiq-green-12); color: var(--eiq-green); }
    .profile-stat__icon--goals { background: var(--eiq-amber-15); color: var(--eiq-orange); }
    .profile-stat__label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--eiq-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .profile-stat__value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--eiq-foreground);
      margin: 0.125rem 0 0;
    }

    /* ── Main grid ── */
    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      align-items: start;
    }

    /* Personal info */
    .profile-fields {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .profile-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .profile-field__label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--eiq-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .profile-field__value-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .profile-field__value {
      font-size: 0.875rem;
      color: var(--eiq-foreground);
      font-weight: 500;
    }
    .profile-field__check {
      color: var(--eiq-green);
      flex-shrink: 0;
    }

    /* Completion */
    .profile-completion {
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }
    .profile-completion__ring {
      position: relative;
      width: 84px;
      height: 84px;
      flex-shrink: 0;
    }
    .profile-completion__pct {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--eiq-foreground);
    }
    .profile-completion__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      flex: 1;
    }
    .profile-completion__item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--eiq-muted);
    }
    .profile-completion__item--done {
      color: var(--eiq-foreground);
    }
    .profile-completion__check {
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--eiq-hover);
      color: var(--eiq-muted);
    }
    .profile-completion__item--done .profile-completion__check {
      background: var(--eiq-green-12);
      color: var(--eiq-green);
    }

    /* Financial overview */
    .profile-fin {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .profile-fin__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--eiq-border);
    }
    .profile-fin__row:last-child {
      border-bottom: none;
    }
    .profile-fin__label {
      font-size: 0.8125rem;
      color: var(--eiq-muted);
    }
    .profile-fin__right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .profile-fin__value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--eiq-foreground);
    }
    .profile-fin__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
    }
    .profile-fin__dot--success { background: var(--eiq-green); }
    .profile-fin__dot--danger { background: var(--eiq-red); }
    .profile-fin__dot--info { background: var(--eiq-primary); }
    .profile-fin__dot--purple { background: var(--eiq-purple); }

    /* Recent activity */
    .profile-activity {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .profile-activity__item {
      display: flex;
      gap: 0.625rem;
      align-items: flex-start;
    }
    .profile-activity__bullet {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--eiq-muted);
      margin-top: 0.3125rem;
      flex-shrink: 0;
    }
    .profile-activity__item--success .profile-activity__bullet { background: var(--eiq-green); }
    .profile-activity__item--info .profile-activity__bullet { background: var(--eiq-primary); }
    .profile-activity__text {
      font-size: 0.8125rem;
      color: var(--eiq-foreground);
      margin: 0;
      line-height: 1.4;
    }
    .profile-activity__time {
      font-size: 0.6875rem;
      color: var(--eiq-subtle);
      margin: 0.125rem 0 0;
    }

    /* Connected accounts */
    .profile-accounts {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .profile-account {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--eiq-border);
      border-radius: 0.625rem;
      transition: background 150ms ease;
    }
    .profile-account:hover {
      background: var(--eiq-hover);
    }
    .profile-account__info {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .profile-account__name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--eiq-foreground);
    }
    .profile-account__status {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background: var(--eiq-hover);
      color: var(--eiq-muted);
    }
    .profile-account__status--active {
      background: var(--eiq-green-12);
      color: var(--eiq-green);
    }
    .profile-account__action {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.3125rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid var(--eiq-border);
      background: var(--eiq-surface);
      color: var(--eiq-muted);
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
    }
    .profile-account__action:hover {
      background: var(--eiq-hover);
      color: var(--eiq-foreground);
    }
    .profile-account__action--primary {
      border-color: var(--eiq-primary);
      color: var(--eiq-primary);
      background: var(--eiq-primary-10);
    }
    .profile-account__action--primary:hover {
      background: var(--eiq-primary);
      color: #fff;
    }

    /* Achievements */
    .profile-achievements {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
    .profile-achievement {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 0.875rem 0.5rem;
      border: 1px solid var(--eiq-border);
      border-radius: 0.75rem;
      background: var(--eiq-input-bg);
      text-align: center;
      transition: box-shadow 150ms ease, transform 150ms ease;
    }
    .profile-achievement:hover {
      box-shadow: var(--eiq-shadow-sm);
      transform: translateY(-1px);
    }
    .profile-achievement__icon {
      font-size: 1.5rem;
      line-height: 1;
    }
    .profile-achievement__label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--eiq-foreground);
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .profile-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .profile-stats { grid-template-columns: 1fr; }
      .profile-completion { flex-direction: column; align-items: stretch; }
      .profile-completion__list { grid-template-columns: 1fr; }
      .profile-achievements { grid-template-columns: repeat(2, 1fr); }
      .profile-hero__content { flex-direction: column; align-items: flex-start; margin-top: -52px; }
    }
  `],
})
export class ProfileComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly txnService = inject(TransactionService);
  private readonly goalsService = inject(GoalsService);
  private readonly dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.goalsService.loadGoals().subscribe();
  }

  readonly editing = signal(false);

  readonly navItems = NAV_ITEMS;

  readonly user = this.authService.currentUser;

  readonly displayName = computed(() => this.user()?.name ?? 'James Davidson');

  readonly memberSince = computed(() => {
    const created = this.user()?.createdAt;
    if (!created) {
      return 'Jun 2024';
    }
    return created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // Stats row — derived from real services where possible.
  readonly stats = computed<StatItem[]>(() => {
    const txns = this.txnService.totalStats();
    const goals = this.goalsService.totals();
    return [
      { label: 'Total Transactions', value: '248', icon: 'transactions' },
      {
        label: 'Total Saved',
        value: '$' + (txns.income - txns.expense).toLocaleString(undefined, { maximumFractionDigits: 0 }),
        icon: 'savings',
      },
      { label: 'Active Goals', value: String(goals.active), icon: 'goals' },
    ];
  });

  readonly personalFields = signal<ProfileField[]>([
    { label: 'Full Name', value: this.displayName() },
    { label: 'Email', value: this.user()?.email ?? 'james.davidson@email.com', verified: true },
    { label: 'Phone', value: '+1 (555) 234-5678' },
    { label: 'Date of Birth', value: 'March 15, 1990' },
    { label: 'Gender', value: 'Male' },
    { label: 'Occupation', value: 'Software Engineer' },
  ]);

  readonly completionItems = signal<CompletionItem[]>([
    { label: 'Profile Photo', done: false },
    { label: 'Personal Info', done: true },
    { label: 'Financial Goals', done: true },
    { label: 'Linked Accounts', done: true },
    { label: 'Budget Setup', done: true },
    { label: 'Notifications', done: true },
  ]);

  readonly completionPct = computed(() => {
    const items = this.completionItems();
    const done = items.filter((i) => i.done).length;
    return Math.round((done / items.length) * 100);
  });

  readonly ringDash = computed(() => {
    const circumference = 2 * Math.PI * 36;
    return `${circumference}`;
  });

  readonly ringOffset = computed(() => {
    const circumference = 2 * Math.PI * 36;
    return `${circumference - (this.completionPct() / 100) * circumference}`;
  });

  readonly financialStats = computed<FinancialStat[]>(() => {
    const summary = this.dashboardService.stats();
    return [
      { label: 'Monthly Income', value: '$' + summary.monthlyIncome.toLocaleString(), tone: 'success' },
      { label: 'Monthly Expenses', value: '$' + summary.monthlyExpense.toLocaleString(), tone: 'danger' },
      { label: 'Savings Rate', value: '38.8%', tone: 'info' },
      { label: 'Net Worth', value: '$48,200', tone: 'purple' },
    ];
  });

  readonly recentActivity = signal<ActivityItem[]>([
    { text: 'Added transaction: Grocery Shopping — $85.00', time: '1 hour ago', tone: 'info' },
    { text: 'Budget updated: Food category', time: '1 day ago', tone: 'neutral' },
    { text: 'Goal achieved: Emergency Fund', time: '1 week ago', tone: 'success' },
    { text: 'New recurring: Netflix subscription', time: '3 days ago', tone: 'info' },
    { text: 'Report generated: May 2025', time: '1 month ago', tone: 'neutral' },
  ]);

  readonly connectedAccounts = signal<ConnectedAccount[]>([
    { name: 'Chase Bank', status: 'Active' },
    { name: 'PayPal', status: 'Active' },
    { name: 'Google Pay', status: 'Active' },
    { name: 'Apple Pay', status: 'Inactive' },
  ]);

  readonly achievements = signal<Achievement[]>([
    { label: 'Budget Master', icon: '🎯' },
    { label: 'Savings Champion', icon: '🏆' },
    { label: '30-Day Streak', icon: '🔥' },
    { label: 'Debt Free', icon: '💚' },
    { label: 'Goal Crusher', icon: '💪' },
    { label: 'Smart Saver', icon: '⭐' },
  ]);

  toggleEdit(): void {
    this.editing.update((v) => !v);
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
  }

  connect(name: string): void {
    this.connectedAccounts.update((list) =>
      list.map((a) => (a.name === name ? { ...a, status: 'Active' } : a))
    );
  }

  disconnect(name: string): void {
    this.connectedAccounts.update((list) =>
      list.map((a) => (a.name === name ? { ...a, status: 'Inactive' } : a))
    );
  }
}
