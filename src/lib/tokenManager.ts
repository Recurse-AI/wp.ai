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
      const token = localStorage.getItem(this.TOKEN_KEY);
      console.log('🔑 TokenManager: Getting access token from localStorage', token ? 'exists' : 'not found');
      return token;
    }
    return null;
  }

  /**
   * Save refresh token to localStorage
   */
  static setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      console.log('💾 TokenManager: Saving refresh token to localStorage');
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
      
      // Verify token was set
      const savedToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      console.log('✅ TokenManager: Refresh token saved correctly?', savedToken === token);
    }
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      console.log('🔄 TokenManager: Getting refresh token from localStorage', token ? 'exists' : 'not found');
      return token;
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
      // Handle empty or invalid tokens
      if (!token || token === 'undefined' || token === 'null') {
        console.error('❌ Invalid token provided to isTokenExpired');
        return true;
      }

      const decoded = jwtDecode<DecodedToken>(token);
      
      // Handle malformed tokens that decode but don't have expiration
      if (!decoded || typeof decoded.exp !== 'number') {
        console.error('❌ Token missing expiration data:', decoded);
        return true;
      }
      
      const currentTime = Date.now() / 1000;
      
      // Add a 60-second buffer to ensure refresh happens before expiration
      const isExpired = decoded.exp < currentTime + 60;
      
      // Log expiration details
      console.log('🕒 Token expiration check:', {
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        currentTime: new Date(currentTime * 1000).toISOString(),
        timeLeft: Math.round(decoded.exp - currentTime),
        isExpired
      });
      
      return isExpired;
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Check if the refresh token is expired
   */
  static isRefreshTokenExpired(refreshToken: string): boolean {
    try {
      // Handle empty or invalid tokens
      if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
        console.error('❌ Invalid refresh token provided to isRefreshTokenExpired');
        return true;
      }

      const decoded = jwtDecode<DecodedToken>(refreshToken);
      
      // Handle malformed tokens that decode but don't have expiration
      if (!decoded || typeof decoded.exp !== 'number') {
        console.error('❌ Refresh token missing expiration data:', decoded);
        return true;
      }
      
      const currentTime = Date.now() / 1000;
      
      // Add a small buffer to ensure we don't cut it too close
      const isExpired = decoded.exp < currentTime + 10;
      
      console.log('🕒 Refresh token expiration check:', {
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        currentTime: new Date(currentTime * 1000).toISOString(),
        timeLeft: Math.round(decoded.exp - currentTime),
        isExpired
      });
      
      return isExpired;
    } catch (error) {
      console.error('❌ Error checking refresh token expiration:', error);
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
      console.error('❌ No refresh token available');
      this.clearTokens();
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/signin') && 
          !window.location.pathname.includes('/signup')) {
        window.location.href = '/signin?reason=missing_token';
      }
      throw new Error('No refresh token available');
    }
    
    // Check if refresh token is expired (1 month validity)
    if (this.isRefreshTokenExpired(refreshToken)) {
      console.error('❌ Refresh token expired. User needs to log in again.');
      this.clearTokens();
      // If in browser environment, redirect to login
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/signin') && 
          !window.location.pathname.includes('/signup')) {
        window.location.href = '/signin?reason=expired';
      }
      throw new Error('Refresh token expired');
    }

    this.isRefreshing = true;
    this.refreshPromise = new Promise<string>(async (resolve, reject) => {
      try {
        console.log('🔄 Attempting to refresh access token with refresh token');
        const response = await AuthService.refreshToken(refreshToken);
        
        console.log('✅ Refresh token response:', response);
        
        if (!response || !response.access) {
          console.error('❌ Invalid response from refresh token API', response);
          throw new Error('Invalid response from refresh token API');
        }
        
        const newAccessToken = response.access;
        
        // Save the new access token (keeping the same refresh token)
        this.setToken(newAccessToken);
        
        // Log token details
        try {
          const decoded = jwtDecode<DecodedToken>(newAccessToken);
          console.log('✅ Successfully refreshed access token:', {
            userId: decoded.user_id,
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
            tokenType: decoded.token_type
          });
        } catch (decodeError) {
          console.error('❌ Error decoding refreshed token:', decodeError);
        }
        
        resolve(newAccessToken);
      } catch (error: any) {
        // Capture more details about the error
        const errorDetail = error?.detail || '';
        const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
        
        console.error('❌ Failed to refresh token:', {
          message: errorMessage,
          detail: errorDetail,
          status: error?.status || 'unknown'
        });
        
        // Check for specific error types
        const isRefreshTokenInvalid = 
          errorDetail.includes('invalid') || 
          errorDetail.includes('expired') || 
          errorDetail.includes('not valid');
          
        // If refresh token is invalid, clear all tokens
        this.clearTokens();
        
        // Redirect to login page if not already there
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/signin') && 
            !window.location.pathname.includes('/signup')) {
          
          const reason = isRefreshTokenInvalid ? 'token_expired' : 'refresh_failed';
          console.log(`🔄 Redirecting to login page after refresh failure: ${reason}`);
          window.location.href = `/signin?reason=${reason}`;
        }
        
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
    // Get the current token
    const token = this.getToken();
    
    console.log('🔄 TokenManager.getValidToken called, token exists:', !!token);
    
    // If no token, check if there's a refresh token we can use
    if (!token) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken && !this.isRefreshTokenExpired(refreshToken)) {
        console.log('🔄 No access token, but refresh token exists. Attempting refresh...');
        try {
          return await this.refreshAccessToken();
        } catch (refreshError) {
          console.error('❌ Failed to refresh token when none existed:', refreshError);
          this.clearTokens(); // Ensure tokens are cleared on failure
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && 
              !window.location.pathname.includes('/signin') && 
              !window.location.pathname.includes('/signup')) {
            window.location.href = '/signin?reason=token_refresh_failed';
          }
          return null;
        }
      }
      // No valid tokens available
      console.error('❌ No valid tokens available');
      return null;
    }
    
    // Check if the current token is expired
    try {
      const isExpired = this.isTokenExpired(token);
      if (isExpired) {
        console.log('🔄 Access token expired, attempting refresh...');
        try {
          const newToken = await this.refreshAccessToken();
          console.log('✅ Successfully refreshed access token:', !!newToken);
          return newToken;
        } catch (refreshError) {
          console.error('❌ Failed to refresh expired token:', refreshError);
          // Don't need to redirect here as refreshAccessToken will handle it
          return null;
        }
      } else {
        console.log('✅ Access token is valid, no refresh needed');
        return token;
      }
    } catch (error) {
      console.error('❌ Error validating token:', error);
      // Try to refresh if token validation fails
      try {
        console.log('🔄 Token validation failed, attempting refresh...');
        return await this.refreshAccessToken();
      } catch (refreshError) {
        console.error('❌ Failed to refresh after validation error:', refreshError);
        // Don't need to redirect here as refreshAccessToken will handle it
        return null;
      }
    }
  }

  /**
   * Store both access and refresh tokens
   */
  static storeTokens(accessToken: string, refreshToken: string): void {
    console.log('🔐 TokenManager: Storing both tokens...');
    
    if (!accessToken || !refreshToken) {
      console.error('❌ TokenManager: Invalid tokens provided', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken
      });
      return;
    }
    
    // Validate tokens are properly formatted JWTs before storing
    try {
      // Check if tokens can be decoded
      const decodedAccess = jwtDecode<DecodedToken>(accessToken);
      const decodedRefresh = jwtDecode<DecodedToken>(refreshToken);
      
      if (!decodedAccess.exp || !decodedRefresh.exp) {
        console.error('❌ TokenManager: Invalid token format - missing expiration');
        return;
      }
      
      // Store the tokens
      this.setToken(accessToken);
      this.setRefreshToken(refreshToken);
      
      // Verify tokens were stored correctly
      setTimeout(() => {
        const storedAccessToken = this.getToken();
        const storedRefreshToken = this.getRefreshToken();
        
        console.log('✅ TokenManager: Token storage verification', {
          accessTokenStored: !!storedAccessToken,
          refreshTokenStored: !!storedRefreshToken,
          accessTokenMatches: storedAccessToken === accessToken,
          refreshTokenMatches: storedRefreshToken === refreshToken
        });
        
        // Try to decode the access token to verify it's valid
        try {
          const decoded = this.getDecodedToken();
          console.log('🔍 TokenManager: Decoded token', {
            userId: decoded?.user_id,
            expiresAt: decoded ? new Date(decoded.exp * 1000).toISOString() : null,
            tokenType: decoded?.token_type
          });
        } catch (error) {
          console.error('❌ TokenManager: Failed to decode token', error);
        }
      }, 100);
    } catch (error) {
      console.error('❌ TokenManager: Failed to validate tokens', error);
      // Don't store invalid tokens
      return;
    }
  }
}

export default TokenManager; 