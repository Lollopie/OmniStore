import { ThemeToggle } from '../../theme/components/ThemeToggle.tsx';
import { useTheme } from '../../theme/hooks/useTheme.tsx';
import { PageCard, SectionCard } from '../../../components/PageCard.tsx';

export default function PreferenceSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <PageCard title="Preferences" description="Personalize how the app looks for you.">
      <SectionCard title="Appearance" description="Switch between light and dark mode.">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </SectionCard>

      <SectionCard title="Language" description="Choose the language of the interface.">
        <select
          aria-label="Language"
          className="select focus:outline-none focus:ring-2 focus:border-none focus:ring-accent">
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="fr">French</option>
        </select>
      </SectionCard>
    </PageCard>
  );
}