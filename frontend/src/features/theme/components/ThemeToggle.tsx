interface ThemeToggleProps {
  theme: "omnistore-light" | "omnistore-dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <label className="flex cursor-pointer gap-2 items-center">
      <svg xmlns="http://www.w3.org/2000/svg"
           width="20"
           height="20"
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor">
        <use href="/icons.svg#sun-icon" />
      </svg>
      <input type="checkbox" onChange={onToggle} checked={theme === "omnistore-dark"} className="toggle theme-controller" />
      <svg xmlns="http://www.w3.org/2000/svg"
           width="20"
           height="20"
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor">
        <use href="/icons.svg#moon-icon" />
      </svg>
    </label>
  );
}