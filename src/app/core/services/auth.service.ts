import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponseDto, CurrentUserDto, LoginDto, RegisterDto } from '../models';

export interface DecodedJwtPayload {
  sub?: string;
  nameid?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  jti?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  // Signals
  readonly token = signal<string | null>(this.getValidStoredToken());
  readonly currentUser = signal<CurrentUserDto | null>(this.getStoredUser());

  // Computed state
  readonly isAuthenticated = computed(() => {
    const t = this.token();
    return !!t && !this.isTokenExpired(t);
  });

  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly isAdmin = computed(() => this.roles().includes('Admin'));
  readonly isOrganizer = computed(() => this.roles().includes('Organizer'));
  readonly isStaff = computed(() => this.roles().includes('Staff'));
  readonly userFullName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  login(dto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, dto).pipe(
      tap((response) => this.setSession(response))
    );
  }

  register(dto: RegisterDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/register`, dto).pipe(
      tap((response) => this.setSession(response))
    );
  }

  loadCurrentUser(): Observable<CurrentUserDto> {
    return this.http.get<CurrentUserDto>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.saveUser(user);
      })
    );
  }

  updateCurrentUser(user: CurrentUserDto): void {
    this.currentUser.set(user);
    this.saveUser(user);
  }

  logout(): void {
    this.clearStorage();
    this.token.set(null);
    this.currentUser.set(null);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    const currentRoles = this.roles();
    return requiredRoles.some((r) => currentRoles.includes(r));
  }

  getUserId(): string | null {
    const user = this.currentUser();
    if (user?.id) return user.id;

    const token = this.token();
    if (!token) return null;
    const payload = this.parseJwt(token);
    return payload?.sub || payload?.nameid || null;
  }

  getUserEmail(): string | null {
    return this.currentUser()?.email || this.parseJwt(this.token())?.email || null;
  }

  /**
   * Safely decodes a base64url encoded JWT payload without external libraries.
   */
  parseJwt(token?: string | null): DecodedJwtPayload | null {
    const jwt = token ?? this.token();
    if (!jwt) return null;

    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as DecodedJwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verifies if the token is expired according to its `exp` Unix timestamp.
   * Applies a 5-second buffer to guard against clock skew.
   */
  isTokenExpired(token?: string | null): boolean {
    const jwt = token ?? this.token();
    if (!jwt) return true;

    const payload = this.parseJwt(jwt);
    if (!payload || !payload.exp) return true;

    const expiryTimeMs = payload.exp * 1000;
    const nowMs = Date.now();
    // 5-second leeway
    return nowMs >= expiryTimeMs - 5000;
  }

  getTokenExpirationDate(token?: string | null): Date | null {
    const payload = this.parseJwt(token ?? this.token());
    if (!payload || !payload.exp) return null;
    return new Date(payload.exp * 1000);
  }

  private setSession(response: AuthResponseDto): void {
    localStorage.setItem(environment.tokenStorageKey, response.accessToken);
    this.token.set(response.accessToken);

    const user: CurrentUserDto = {
      ...response.user,
      roles: response.roles?.length ? response.roles : response.user?.roles ?? [],
    };

    this.saveUser(user);
    this.currentUser.set(user);
  }

  private getValidStoredToken(): string | null {
    const token = localStorage.getItem(environment.tokenStorageKey);
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      this.clearStorage();
      return null;
    }

    return token;
  }

  private getStoredUser(): CurrentUserDto | null {
    const json = localStorage.getItem(environment.userStorageKey);
    if (!json) return null;
    try {
      return JSON.parse(json) as CurrentUserDto;
    } catch {
      return null;
    }
  }

  private saveUser(user: CurrentUserDto): void {
    localStorage.setItem(environment.userStorageKey, JSON.stringify(user));
  }

  private clearStorage(): void {
    localStorage.removeItem(environment.tokenStorageKey);
    localStorage.removeItem(environment.userStorageKey);
  }
}
