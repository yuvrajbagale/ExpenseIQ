import { NAV_ITEMS, NavItem } from './nav-items';

describe('NAV_ITEMS', () => {
  it('should be an array of 11 nav items', () => {
    expect(Array.isArray(NAV_ITEMS)).toBeTrue();
    expect(NAV_ITEMS.length).toBe(11);
  });

  it('should have Dashboard as first item with exact: true', () => {
    expect(NAV_ITEMS[0].label).toBe('Dashboard');
    expect(NAV_ITEMS[0].route).toBe('/dashboard');
    expect(NAV_ITEMS[0].exact).toBeTrue();
  });

  it('should have consistent structure for all items', () => {
    NAV_ITEMS.forEach((item: NavItem) => {
      expect(item.label).toBeTruthy();
      expect(item.route).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.route.startsWith('/')).toBeTrue();
    });
  });

  it('should not have duplicate routes', () => {
    const routes = NAV_ITEMS.map(i => i.route);
    const unique = new Set(routes);
    expect(unique.size).toBe(routes.length);
  });
});
