// src/lib/mock-utils.ts
// Utility functions for using mock data when APIs are not available

// Set this to true to enable mock mode globally
// In production, this should be false or controlled by environment variable
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true" || false;

/**
 * Wraps an API call with mock data fallback
 * @param apiCall The actual API call function
 * @param mockData The mock data to return if API fails or mock mode is enabled
 * @param options Options for mock behavior
 */
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  options: {
    useMock?: boolean;
    delay?: number; // Simulate network delay in ms
  } = {}
): Promise<T> {
  const { useMock = USE_MOCK_DATA, delay = 500 } = options;

  if (useMock) {
    // Simulate network delay
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return mockData;
  }

  try {
    return await apiCall();
  } catch (error) {
    // If API fails and we have mock data, return mock data
    console.warn("API call failed, using mock data:", error);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return mockData;
  }
}

/**
 * Creates a mock-enabled query function for React Query
 */
export function createMockQueryFn<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  options: {
    useMock?: boolean;
    delay?: number;
  } = {}
) {
  return async () => {
    return withMockFallback(apiCall, mockData, options);
  };
}

