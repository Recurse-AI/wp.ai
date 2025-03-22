// Helper function to ensure all paths have the correct prefix
const prefixPath = (path: string): string => {
  // Add /api prefix to all paths if not already present
  return path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
};

// All API paths used in the application
export const ApiPaths = {
  // Authentication
  REGISTER: prefixPath("users/auth/register/"),
  LOGIN: prefixPath("users/auth/login/"),
  REFRESH_TOKEN: prefixPath("users/auth/login/refresh/"),
  VERIFY_TOKEN: prefixPath("users/auth/login/verify/"),
  LOGOUT: prefixPath("users/auth/logout/"),

  // Social authentication
  GOOGLE_AUTH: prefixPath("users/auth/google/"),
  FACEBOOK_AUTH: prefixPath("users/auth/facebook/"),
  GITHUB_AUTH: prefixPath("users/auth/google/"),
  WORDPRESS_AUTH: prefixPath("users/auth/google/"),

  // Email verification
  EMAIL_VERIFICATION: prefixPath("users/verify-email/"),
  EMAIL_VERIFICATION_CONFIRM: (uidb64: string, token: string) =>
    prefixPath(`users/verify-email/${uidb64}/${token}/`),

  // Phone verification
  PHONE_VERIFICATION: prefixPath("users/verify-phone/"),

  // Password reset
  RESET_PASSWORD: prefixPath("users/reset-password/"),
  RESET_PASSWORD_CONFIRM: (uidb64: string, token: string) =>
    prefixPath(`/users/reset-password/${uidb64}/${token}/`),

  // Profile management
  USER_PROFILE: prefixPath("users/profile/"),
  CHANGE_PASSWORD: prefixPath("users/change-password/"),

  // User management
  USERS: prefixPath("users/"),
  USER_DETAIL: (id: number) => prefixPath(`users/${id}/`),
  USER_ME: prefixPath("users/me/"),

  // Session management
  SESSIONS: prefixPath("sessions/"),
  TERMINATE_SESSION: (id: number) => prefixPath(`sessions/${id}/terminate/`),
};
