import { ThemeToggle } from '../../theme/components/ThemeToggle.tsx';
import { useTheme } from '../../theme/hooks/useTheme.tsx';

export default function PreferenceSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Preferences</h1>

      <h2 className="text-xl font-semibold">Appearance</h2>
      <div className="mt-4 ml-2">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <h2 className="text-xl font-semibold mt-8">Language</h2>
      <div className="mt-4 ml-2">
        <select className="select select-bordered w-full max-w-xs">
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="fr">French</option>
        </select>
      </div>
    </div>
  );
}