export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Mock authentication for standalone application
export const getLoginUrl = () => {
  // Return hash to prevent navigation - authentication handled locally
  return '#';
};

// Simple user session management
export const isAuthenticated = () => {
  return localStorage.getItem('user_session') !== null;
};

export const getCurrentUser = () => {
  const session = localStorage.getItem('user_session');
  return session ? JSON.parse(session) : null;
};

export const login = (userData: any) => {
  localStorage.setItem('user_session', JSON.stringify({
    id: 'local-user',
    name: userData.name || 'User',
    email: userData.email || 'user@example.com',
    timestamp: Date.now()
  }));
};

export const logout = () => {
  localStorage.removeItem('user_session');
};
