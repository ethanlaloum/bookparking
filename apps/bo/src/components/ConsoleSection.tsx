import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { SectionName } from './sections';

export const ConsoleSection = ({ name, children }: { name: SectionName; children: ReactNode }) => {
  const { t } = useTranslation('admin');
  const title = t(`console.section.${name}`);

  useEffect(() => {
    document.title = `${title} — ${t('console.name')} Bookparking`;
  }, [t, title]);

  return (
    <section aria-labelledby="titre-section">
      <h1
        id="titre-section"
        className="font-display text-[clamp(2rem,4vw,3rem)] leading-none font-bold tracking-[-0.035em] text-fg"
      >
        {title}
      </h1>
      <div className="mt-6">{children}</div>
    </section>
  );
};
