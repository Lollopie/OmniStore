import type { ReactNode } from 'react';

interface PageCardProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** Outer card for pages shown next to a side menu (organization, settings). */
export const PageCard = ({ title, description, children }: PageCardProps) => (
  <div className="card bg-base-100 border border-base-300 p-6 sm:p-10 flex flex-col gap-6">
    <header>
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="text-base-content/70 mt-1">{description}</p>}
    </header>
    {children}
  </div>
);

// Literal class names so Tailwind picks them up
const TONES = {
  primary: { section: 'border-primary/30 bg-primary/5', title: 'text-primary' },
  neutral: { section: 'border-base-content/15 bg-base-content/5', title: '' },
  error: { section: 'border-error/30 bg-error/5', title: 'text-error' },
};

interface SectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  tone?: keyof typeof TONES;
  actions?: ReactNode;
  children?: ReactNode;
}

/** A titled section inside a PageCard; `actions` are right-aligned at the bottom. */
export const SectionCard = ({ title, description, tone = 'primary', actions, children }: SectionCardProps) => (
  <section className={`card border ${TONES[tone].section}`}>
    <div className="card-body gap-4">
      <h3 className={`card-title ${TONES[tone].title}`}>{title}</h3>
      {description && <p className="text-sm text-base-content/80">{description}</p>}
      {children}
      {actions && <div className="card-actions justify-end">{actions}</div>}
    </div>
  </section>
);
