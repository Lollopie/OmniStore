import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<"omnistore-light" | "omnistore-dark">(
    () => (localStorage.getItem("theme") as "omnistore-dark") || "omnistore-light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "omnistore-dark" ? "omnistore-light" : "omnistore-dark"));
  };

  return { theme, toggleTheme };
}
