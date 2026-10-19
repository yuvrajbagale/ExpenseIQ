import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SidebarComponent } from './sidebar.component';
import { NAV_ITEMS } from '../constants/nav-items';
import { provideAppIcons } from '../icons/app-icons';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  beforeEach(async () => {
    localStorage.clear();
    document.body.classList.remove('eiq-app--rail');
    document.body.classList.remove('eiq-nav-open');

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, HttpClientTestingModule],
      providers: [provideRouter([]), ...provideAppIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('eiq-app--rail');
    document.body.classList.remove('eiq-nav-open');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should group navigation into Overview, Insights and Manage', () => {
    expect(component.groups.map((g) => g.label)).toEqual(['Overview', 'Insights', 'Manage']);
  });

  it('should surface every NAV_ITEMS route across the groups', () => {
    const routes = component.groups.flatMap((g) => g.items.map((i) => i.route));
    for (const item of NAV_ITEMS) {
      expect(routes).toContain(item.route);
    }
  });

  it('should render the mobile bottom bar with five destinations', () => {
    expect(component.bottomNav.length).toBe(5);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.eiq-bottom-nav__item').length).toBe(5);
  });

  it('should render every grouped item in the sidebar nav', () => {
    const expected = component.groups.reduce((n, g) => n + g.items.length, 0);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eiq-sidebar__nav')?.querySelectorAll('.eiq-nav__item').length).toBe(expected);
  });

  it('should toggle the collapsed rail and persist the preference', () => {
    expect(component.collapsed()).toBeFalse();

    component.toggleCollapse();

    expect(component.collapsed()).toBeTrue();
    expect(document.body.classList.contains('eiq-app--rail')).toBeTrue();
    expect(localStorage.getItem('eiq.sidebar.collapsed')).toBe('true');

    component.toggleCollapse();

    expect(component.collapsed()).toBeFalse();
    expect(document.body.classList.contains('eiq-app--rail')).toBeFalse();
  });

  it('should close the mobile nav when a link is activated', () => {
    document.body.classList.add('eiq-nav-open');
    component.closeMobileNav();
    expect(document.body.classList.contains('eiq-nav-open')).toBeFalse();
  });

  it('should render every nav icon through the shared icon component', () => {
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.eiq-nav__item');
    const icons = el.querySelectorAll('.eiq-nav__item eiq-icon');
    expect(icons.length).toBe(items.length);
    expect(icons.length).toBeGreaterThan(0);
    // `draw` publishes per-shape lengths, so the markup is animated, not static.
    expect(el.querySelector('.eiq-icon--draw')).toBeTruthy();
  });

  it('should use a caller-supplied navItems list as a single group', () => {
    component.navItems = [{ label: 'Only', route: '/only', icon: 'lucideLayoutDashboard' }];
    fixture.detectChanges();

    expect(component.groups.length).toBe(1);
    expect(component.groups[0].items.length).toBe(1);
  });
});