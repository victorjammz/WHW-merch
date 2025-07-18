import { useCallback, useMemo, useRef } from 'react';

// Debounce hook for search inputs and API calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Throttle hook for scroll events and frequent updates
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRan = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      }
    }) as T,
    [callback, delay]
  );
};

// Memoized filter/search hook
export const useMemoizedFilter = <T>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, term: string) => boolean
) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item => filterFn(item, searchTerm.toLowerCase()));
  }, [items, searchTerm, filterFn]);
};

// Stable callback hook to prevent unnecessary re-renders
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
};