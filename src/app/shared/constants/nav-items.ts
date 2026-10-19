/**
 * Shared navigation items for the sidebar.
 *
 * All feature components that render <eiq-sidebar> should import NAV_ITEMS
 * from this file instead of defining their own duplicate arrays.
 *
 * `icon` is a name from the curated registry in `shared/icons/app-icons.ts`,
 * so a typo fails the build instead of rendering an empty box.
 *
 * The NavItem interface is also re-exported here for convenience.
 */
import { AppIconName } from '../icons/app-icons';

export interface NavItem {
  label: string;
  route: string;
  icon: AppIconName;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       route: '/dashboard',        icon: 'lucideLayoutDashboard', exact: true },
  { label: 'Transactions',    route: '/transactions',     icon: 'lucideArrowLeftRight'                          },
  { label: 'Add Transaction', route: '/transactions/add', icon: 'lucideCirclePlus'                               },
  { label: 'Categories',      route: '/categories',       icon: 'lucideTag'                                     },
  { label: 'Budget',          route: '/budget',           icon: 'lucideChartPie'                                },
  { label: 'Analytics',       route: '/analytics',        icon: 'lucideTrendingUp'                              },
  { label: 'Reports',         route: '/reports',          icon: 'lucideFileText'                                },
  { label: 'Goals',           route: '/goals',            icon: 'lucideFlag'                                    },
  { label: 'Calendar',        route: '/calendar',         icon: 'lucideCalendarDays'                            },
  { label: 'Wallet Accounts', route: '/accounts',         icon: 'lucideWalletCards'                             },
  { label: 'Recurring',       route: '/recurring',        icon: 'lucideRefreshCw'                               },
];
