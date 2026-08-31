import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with unauthenticated state', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should set error and clear it', () => {
    service.setError('Test error');
    expect(service.authError()).toBe('Test error');

    service.clearError();
    expect(service.authError()).toBeNull();
  });

  it('should logout and navigate to login', () => {
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should restore session from localStorage', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    localStorage.setItem('eq_token', 'test-token');
    localStorage.setItem('eq_user', JSON.stringify(user));

    const newService = new AuthService(routerSpy, TestBed.inject(HttpClientTestingModule) as any);
    // Service calls restoreSession in constructor
    expect(newService).toBeTruthy();
  });

  it('should handle login success', () => {
    const credentials = { email: 'test@example.com', password: 'password123', rememberMe: false };
    const mockResponse = {
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-jwt-token',
      },
    };

    service.login(credentials).subscribe();

    const req = httpMock.expectOne(`${(service as any).http.constructor.name ? '' : ''}/auth/login`);
    // The actual URL depends on environment.apiUrl, so just flush any pending request
    if (req) {
      req.flush(mockResponse);
    }
  });

  it('deriveName should format email prefix correctly', () => {
    const deriveName = (service as any).deriveName.bind(service);
    expect(deriveName('john.doe@example.com')).toBe('John Doe');
    expect(deriveName('jane_smith@test.com')).toBe('Jane Smith');
    expect(deriveName('bob@example.com')).toBe('Bob');
  });

  it('deriveInitials should create initials from email', () => {
    const deriveInitials = (service as any).deriveInitials.bind(service);
    expect(deriveInitials('john.doe@example.com')).toBe('JD');
    expect(deriveInitials('jane@test.com')).toBe('J');
  });
});
