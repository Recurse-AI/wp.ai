import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Simplified user authentication check that doesn't rely on API calls
 * 
 * @param setIsLoggedIn - Function to update login state
 * @param setUser - Function to update user state
 * @param router - Next.js router instance
 * @param pathname - Current pathname
 * @returns Promise<boolean> - Returns true if user is authenticated
 */
export const getUser = async (
  setIsLoggedIn: (value: boolean) => void,
  setUser: (value: { name: string; image: string }) => void,
  router: AppRouterInstance,
  pathname: string
): Promise<boolean> => {
  try {
    // Check if we have user data in localStorage
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      
      if (parsedData && parsedData.user) {
        // User is authenticated
        setIsLoggedIn(true);
        
        // Set user data
        setUser({
          name: parsedData.user.username || parsedData.user.full_name || '',
          image: parsedData.profile_pic || '',
        });
        
        return true;
      }
    }
    
    // Check if we have authToken as fallback
    const authToken = localStorage.getItem('token');
    
    if (authToken) {
      // We have a token but no user data
      // Just mark as logged in without setting user details
      setIsLoggedIn(true);
      return true;
    }
    
    // No authentication found
    setIsLoggedIn(false);
    setUser({ name: '', image: '' });
    
    // Redirect to login if trying to access protected routes
    const protectedRoutes = ['/profile', '/chat', '/settings'];
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      // Save the current path if it's a chat route so we can redirect back after login
      if (pathname.startsWith('/chat')) {
        localStorage.setItem('isChat', 'true');
      }
      router.push('/signin');
    }
    
    return false;
  } catch (error) {
    console.error('Error in getUser:', error);
    
    // Reset state on error
    setIsLoggedIn(false);
    setUser({ name: '', image: '' });
    return false;
  }
}; 