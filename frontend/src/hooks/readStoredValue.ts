export const readStoredValue = <T = unknown>(key: string, fallback: T | string = ''): T | string => {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    console.log(key, fallback);
    return fallback;
  }

  try {
    console.log(key, JSON.parse(storedValue) as T);
    return JSON.parse(storedValue) as T;
  } catch {
    console.log(key, storedValue);
    return storedValue;
  }
};