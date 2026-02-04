import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // TODO: Replace with real authentication logic
  login(email: string, password: string) {
    const promise = new Promise<{ token: string }>((resolve, reject) => {
      // Simulate an HTTP request
      setTimeout(() => {
        if (email === 'admin@example.com' && password === 'password') {
          resolve({ token: 'fake-jwt-token' });
        } else {
          reject('Invalid username or password');
        }
      }, 1000);
    }).then((response) => {
      if (this.isBrowser) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('expiresAt', (Date.now() + 60 * 60 * 1000).toString()); // 1 hour expiry
      }
      return response;
    })

    return promise;
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('expiresAt');
    }
    return Promise.resolve();
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    const token = localStorage.getItem('authToken');
    const expiresAt = localStorage.getItem('expiresAt');

    if (!token || !expiresAt) {
      return false;
    }

    return Date.now() < parseInt(expiresAt, 10);
  }
}
