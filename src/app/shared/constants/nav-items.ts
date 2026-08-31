/**
 * Shared navigation items for the sidebar.
 *
 * All feature components that render <eiq-sidebar> should import NAV_ITEMS
 * from this file instead of defining their own duplicate arrays.
 *
 * The NavItem interface is also re-exported here for convenience.
 */
export interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       route: '/dashboard',        icon: 'dashboard',              exact: true },
  { label: 'Transactions',    route: '/transactions',     icon: 'swap_horiz'                           },
  { label: 'Add Transaction', route: '/transactions/add', icon: 'add_circle'                            },
  { label: 'Categories',      route: '/categories',       icon: 'label'                                },
  { label: 'Budget',          route: '/budget',           icon: 'pie_chart'                            },
  { label: 'Analytics',       route: '/analytics',        icon: 'trending_up'                          },
  { label: 'Reports',         route: '/reports',          icon: 'description'                          },
  { label: 'Goals',           route: '/goals',            icon: 'flag'                                 },
  { label: 'Calendar',        route: '/calendar',         icon: 'calendar_month'                       },
  { label: 'Wallet Accounts', route: '/accounts',         icon: 'account_balance_wallet'               },
  { label: 'Recurring',       route: '/recurring',        icon: 'autorenew'                            },
];
