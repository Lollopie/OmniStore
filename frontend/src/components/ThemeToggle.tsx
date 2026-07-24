import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"omnistore-light" | "omnistore-dark">(
    () => (localStorage.getItem("theme") as "omnistore-dark") || "omnistore-light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? "omnistore-dark" : "omnistore-light");
  };

  return (
    <label className="swap swap-rotate">
      <input
        type="checkbox"
        onChange={toggleTheme}
        checked={theme === "omnistore-dark"}
      />

      <svg className="swap-off h-10 w-10 fill-current">
        <use href="icons.svg#sun-icon" />
      </svg>

      <svg className="swap-on h-10 w-10 fill-current" viewBox="0 0 24 24">
        <use href="icons.svg#moon-icon" />
      </svg>
    </label>
  );
}