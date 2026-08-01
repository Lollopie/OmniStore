export const readStoredValue = <T = unknown>(key: string, fallback: T | string = ''): T | string => {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) return fallback;

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    return storedValue;
  }
};