import { ThemeToggle } from '../../theme/components/ThemeToggle.tsx';
import { useTheme } from '../../theme/hooks/useTheme.tsx';

export default function PreferenceSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Preferences</h1>

      <h2 className="text-xl font-semibold">Appearance</h2>
      <div className="mt-4 ml-2">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <h2 className="text-xl font-semibold mt-8">Language</h2>
      <select className="select focus:outline-none focus:ring-2 focus:border-none focus:ring-accent mt-4 ml-2">
        <option value="en">English</option>
        <option value="de">German</option>
        <option value="fr">French</option>
      </select>
    </div>
  );
}