import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface UserData {
  name: string;
  username: string;
  email: string;
  image: string;
  profile_picture: string;
}

const defaultUserData: UserData = {
  name: "Guest User",
  username: "guest_user",
  email: "guest@example.com",
  image: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  profile_picture: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs="
};

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
  setUser: (value: UserData) => void,
  router: AppRouterInstance,
  pathname: string
): Promise<boolean> => {
  try {
    // Check if we have user data in localStorage
    const userData = localStorage.getItem('userData');
    console.log('Raw userData from localStorage:', userData);
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('Parsed userData:', parsedData);
      
      // Check if we have the required user data
      if (parsedData) {
        // User is authenticated
        setIsLoggedIn(true);
        
        // Set user data with defaults for missing fields
        setUser({
          name: parsedData.name || parsedData.username || defaultUserData.name,
          username: parsedData.username || defaultUserData.username,
          email: parsedData.email || defaultUserData.email,
          image: parsedData.image || parsedData.profile_picture || defaultUserData.image,
          profile_picture: parsedData.profile_picture || parsedData.image || defaultUserData.profile_picture
        });
        
        return true;
      }
    }
    
    // Check if we have authToken as fallback
    const authToken = localStorage.getItem('token');
    console.log('Auth token found:', !!authToken);
    
    if (authToken) {
      // We have a token but no user data
      setIsLoggedIn(true);
      // Set default user data
      setUser(defaultUserData);
      return true;
    }
    
    // No authentication found
    setIsLoggedIn(false);
    setUser(defaultUserData);
    
    // Redirect to login if trying to access protected routes
    const protectedRoutes = ['/profile', '/chat', '/settings'];
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      if (pathname.startsWith('/chat')) {
        localStorage.setItem('isChat', 'true');
      }
      router.push('/signin');
    }
    
    return false;
  } catch (error) {
    console.error('Error in getUser:', error);
    
    // Reset state on error with default user data
    setIsLoggedIn(false);
    setUser(defaultUserData);
    return false;
  }
}; 