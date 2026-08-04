export const PERSISTENT_KEYS = {
  THEME: 'theme',
} as const;

export const AUTH_KEYS = {
  USER_ID: 'userId',
  ACTIVE_ROLE: 'activeRole',
  ACTIVE_WAREHOUSE: 'activeWarehouse',
  USERNAME: 'username',
  USER_WAREHOUSES: 'userWarehouses',
} as const;

export const clearUserSession = (): void => {
  Object.values(AUTH_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const purgeAllUserData = (): void => {
  const currentTheme = localStorage.getItem(PERSISTENT_KEYS.THEME);

  localStorage.clear();
  sessionStorage.clear();

  if (currentTheme) {
    localStorage.setItem(PERSISTENT_KEYS.THEME, currentTheme);
  }
};