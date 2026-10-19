import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let csrfSpy: jasmine.SpyObj<CsrfService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    csrfSpy = jasmine.createSpyObj('CsrfService', ['fetchToken', 'clear']);
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: CsrfService, useValue: csrfSpy },
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

    // logout() also revokes the session server-side
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should restore session from localStorage', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User', initials: 'TU' };
    localStorage.setItem('eq_token', 'test-token');
    localStorage.setItem('eq_user', JSON.stringify(user));

    // Constructing a fresh instance triggers restoreSession() in the constructor
    const newService = new AuthService(routerSpy, TestBed.inject(HttpClient), csrfSpy);

    expect(newService.isAuthenticated()).toBeTrue();
    expect(newService.user()?.email).toBe('test@example.com');
    expect(csrfSpy.fetchToken).toHaveBeenCalled();
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

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('mock-jwt-token');
  });

  it('should surface a failed login as an auth error', () => {
    service.login({ email: 'test@example.com', password: 'wrongpass', rememberMe: false }).subscribe({
      error: () => {},
    });

    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ success: false, message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.authError()).toBeTruthy();
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
