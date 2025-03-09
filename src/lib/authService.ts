import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { ApiPaths } from './apiPaths';
import TokenManager from './tokenManager';

// Type definitions
export type AuthProvider = 'manual' | 'google' | 'facebook' | 'github' | 'wordpress';

export interface UserRegistration {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export interface VerifyEmailRequest {
  email?: string;
  uidb64?: string;
  token?: string;
}

export interface PhoneVerificationRequest {
  phone_number: string;
  verification_code?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  auth_provider?: AuthProvider;
  api_key?: string;
  api_key_created_at?: string;
  last_login_ip?: string;
  created_at?: string;
  updated_at?: string;
  date_joined?: string;
  is_active?: boolean;
}

// Add this at the top of the file, after the imports
let userProfileCache: UserProfile | null = null;
let userProfileCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Auth service with all API endpoints
const AuthService = {
  // User registration and authentication
  register: (userData: UserRegistration) => 
    apiPost<{ message: string; user: UserProfile }>(ApiPaths.REGISTER, userData),

  login: (credentials: LoginCredentials) => 
    apiPost<TokenResponse>(ApiPaths.LOGIN, credentials),

  refreshToken: (refresh: string) => 
    apiPost<{ access: string }>(ApiPaths.REFRESH_TOKEN, { refresh }),

  verifyToken: (token: string) => 
    apiPost<{ status: string }>(ApiPaths.VERIFY_TOKEN, { token }),

  logout: () => {
    // Clear the user profile cache
    userProfileCache = null;
    userProfileCacheTime = 0;
    
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return Promise.resolve({ detail: 'No refresh token' });
    
    return apiPost<{ detail: string }>(ApiPaths.LOGOUT, { refresh_token: refreshToken });
  },

  // Social authentication
  googleAuth: (code: string) => 
    apiPost<TokenResponse>(ApiPaths.GOOGLE_AUTH, { code }),

  facebookAuth: (accessToken: string) => 
    apiPost<TokenResponse>(ApiPaths.FACEBOOK_AUTH, { access_token: accessToken }),

  githubAuth: (code: string) => 
    apiPost<TokenResponse>(ApiPaths.GITHUB_AUTH, { code }),

  wordpressAuth: (code: string) => 
    apiPost<TokenResponse>(ApiPaths.WORDPRESS_AUTH, { code }),

  // Email verification
  requestEmailVerification: () => 
    apiPost<{ message: string }>(ApiPaths.EMAIL_VERIFICATION),

  verifyEmail: (data: VerifyEmailRequest) => 
    apiPost<{ message: string }>(ApiPaths.EMAIL_VERIFICATION, data),

  confirmEmailVerification: (uidb64: string, token: string) => 
    apiGet<TokenResponse>(ApiPaths.EMAIL_VERIFICATION_CONFIRM(uidb64, token)),

  // Phone verification
  requestPhoneVerification: (phone: string) => 
    apiPost<{ message: string }>(ApiPaths.PHONE_VERIFICATION, { phone_number: phone }),

  verifyPhone: (data: PhoneVerificationRequest) => 
    apiPost<{ message: string }>(ApiPaths.PHONE_VERIFICATION, data),

  // Password reset
  requestPasswordReset: (email: string) => 
    apiPost<{ message: string }>(ApiPaths.RESET_PASSWORD, { email }),

  confirmPasswordReset: (data: ResetPasswordConfirmRequest) => 
    apiPost<{ message: string }>(ApiPaths.RESET_PASSWORD_CONFIRM(data.uid, data.token), {
      new_password: data.new_password,
      confirm_password: data.confirm_password
    }),

  // Profile management
  getUserProfile: async () => {
    // Check if we have a cached profile that's not expired
    const currentTime = Date.now();
    if (userProfileCache && (currentTime - userProfileCacheTime) < CACHE_DURATION) {
      return userProfileCache;
    }
    
    // If no cache or expired, fetch from API
    const profile = await apiGet<UserProfile>(ApiPaths.USER_PROFILE);
    
    // Update cache
    userProfileCache = profile;
    userProfileCacheTime = currentTime;
    
    return profile;
  },

  updateUserProfile: (profileData: Partial<UserProfile>) => {
    // Invalidate cache when profile is updated
    userProfileCache = null;
    return apiPut<UserProfile>(ApiPaths.USER_PROFILE, profileData);
  },

  changePassword: (data: ChangePasswordRequest) => 
    apiPost<{ message: string }>(ApiPaths.CHANGE_PASSWORD, data),

  // User management
  getUsers: (page = 1, pageSize = 10) => 
    apiGet<{ count: number; results: UserProfile[] }>(`${ApiPaths.USERS}?page=${page}&page_size=${pageSize}`),

  getUser: (id: number) => 
    apiGet<UserProfile>(ApiPaths.USER_DETAIL(id)),

  createUser: (userData: UserRegistration) => 
    apiPost<UserProfile>(ApiPaths.USERS, userData),

  updateUser: (id: number, userData: Partial<UserProfile>) => 
    apiPut<UserProfile>(ApiPaths.USER_DETAIL(id), userData),

  deleteUser: (id: number) => 
    apiDelete<{ message: string }>(ApiPaths.USER_DETAIL(id)),

  getCurrentUser: async () => {
    // Use the same cache as getUserProfile
    const currentTime = Date.now();
    if (userProfileCache && (currentTime - userProfileCacheTime) < CACHE_DURATION) {
      return userProfileCache;
    }
    
    // If no cache or expired, fetch from API
    const profile = await apiGet<UserProfile>(ApiPaths.USER_PROFILE);
    
    // Update cache
    userProfileCache = profile;
    userProfileCacheTime = currentTime;
    
    return profile;
  },

  // Session management
  getUserSessions: () => 
    apiGet<{ id: number; device: string; ip_address: string; last_activity: string }[]>(ApiPaths.SESSIONS),

  terminateSession: (id: number) => 
    apiPost<{ message: string }>(ApiPaths.TERMINATE_SESSION(id)),

  // Cache management
  clearUserProfileCache: () => {
    userProfileCache = null;
    userProfileCacheTime = 0;
  },
};

export default AuthService; 