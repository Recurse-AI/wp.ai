import AuthService from './authService';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  user_id: number;
  jti: string;
  token_type: string;
  [key: string]: any;
}

class TokenManager {
  private static TOKEN_KEY = 'token';
  private static REFRESH_TOKEN_KEY = 'refreshToken';
  private static isRefreshing = false;
  private static refreshPromise: Promise<string> | null = null;

  /**
   * Save access token to localStorage
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Get access token from localStorage
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Save refresh token to localStorage
   */
  static setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Clear all tokens from localStorage
   */
  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Check if the token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      
      // Add a 30-second buffer to ensure refresh happens before expiration
      return decoded.exp < currentTime + 30;
    } catch (error) {
      return true;
    }
  }

  /**
   * Check if the user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Get decoded token data
   */
  static getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user ID from token
   */
  static getUserId(): number | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.user_id : null;
  }

  /**
   * Refresh the access token using the refresh token
   */
  static async refreshAccessToken(): Promise<string> {
    // Return existing promise if already refreshing
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = new Promise<string>(async (resolve, reject) => {
      try {
        const response = await AuthService.refreshToken(refreshToken);
        const newAccessToken = response.access;
        
        // Save the new access token
        this.setToken(newAccessToken);
        
        resolve(newAccessToken);
      } catch (error) {
        // If refresh fails, clear tokens and force user to login again
        this.clearTokens();
        reject(error);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  static async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }
    
    if (this.isTokenExpired(token)) {
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        return null;
      }
    }
    
    return token;
  }

  /**
   * Store both access and refresh tokens
   */
  static storeTokens(accessToken: string, refreshToken: string): void {
    this.setToken(accessToken);
    this.setRefreshToken(refreshToken);
  }
}

export default TokenManager; 