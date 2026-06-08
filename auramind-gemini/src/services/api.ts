// Core API service
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${import.meta.env.VITE_API_BASE_URL || ''}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

// Authenticated API calls
export const authenticatedApiFetch = async (endpoint: string, options: RequestInit = {}, token: string) => {
  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Re-export specific services for backward compatibility
export { userService } from './user/userService';
export { systemMetricsService as analyticsService } from './analytics/systemMetricsService';



