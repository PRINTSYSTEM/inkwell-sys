import { AsyncSelectOption } from './AsyncSelect';

// Helper function to create simple options from arrays
export const createSimpleOptions = (
  items: string[] | { value: string | number; label: string }[]
): AsyncSelectOption[] => {
  return items.map((item) => {
    if (typeof item === 'string') {
      return { value: item, label: item };
    }
    return item;
  });
};

// Helper function to simulate API loading delay for testing
export const mockLoadOptions = (
  options: AsyncSelectOption[],
  delay: number = 500
): ((search?: string) => Promise<AsyncSelectOption[]>) => {
  return async (search?: string) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (!search) return options;
    
    return options.filter(option =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.description?.toLowerCase().includes(search.toLowerCase())
    );
  };
};

// Helper to load options from API endpoint
export const createApiLoader = (
  endpoint: string,
  transform?: (data: unknown) => AsyncSelectOption[]
): ((search?: string) => Promise<AsyncSelectOption[]>) => {
  return async (search?: string) => {
    const url = new URL(endpoint);
    if (search) {
      url.searchParams.set('search', search);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (transform) {
      return transform(data);
    }

    // Default transformation assumes API returns { value, label }[] format
    return Array.isArray(data) ? data : [];
  };
};

// Common transformers for different API response formats
export const transformers = {
  // For APIs that return { id, name } format
  idName: (data: { id: string | number; name: string }[]): AsyncSelectOption[] => 
    data.map(item => ({ value: item.id, label: item.name })),

  // For APIs that return { value, text } format  
  valueText: (data: { value: string | number; text: string }[]): AsyncSelectOption[] =>
    data.map(item => ({ value: item.value, label: item.text })),

  // For APIs with nested data
  nested: (path: string) => (data: unknown): AsyncSelectOption[] => {
    const nested = path.split('.').reduce((obj, key) => obj?.[key], data);
    return Array.isArray(nested) ? nested : [];
  }
};