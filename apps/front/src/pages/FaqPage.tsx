import { ChevronDown } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { consentSettingsOpened } from '../app/consent/store/consentSettings';
import { useAppDispatch } from '../store/redux';

const LINK = 'font-medium text-accent underline underline-offset-4';

// Chaque réponse décrit ce que le code fait, comme les pages légales : les
// 48 heures du loueur, les 30 minutes de la page de paiement et les 24 heures
// d'annulation gratuite sont ceux de l'api. Une question sans réponse vraie
// n'a pas sa place ici — d'où l'absence de « comment accéder à la place » et
// de « quand suis-je payé », tant que le produit ne sait pas y répondre.
const SECTIONS = [
  {
    id: 'reserver',
    title: 'section.drivers',
    questions: [
      'howToBook',
      'whenCharged',
      'finalPrice',
      'card',
      'driverCancels',
      'ownerCancelsForDriver',
      'vehicles',
      'account',
    ],
  },
  {
    id: 'louer',
    title: 'section.owners',
    questions: [
      'howToPublish',
      'whoSeesAddress',
      'pricing',
      'acceptRequests',
      'ownerCancels',
      'unpublish',
      'taxes',
    ],
  },
  {
    id: 'compte',
    title: 'section.account',
    questions: ['cookies', 'data', 'deleteAccount', 'contact'],
  },
] as const;

export const FaqPage = () => {
  const { t } = useTranslation('faq');
  const dispatch = useAppDispatch();

  // Les réponses n'utilisent chacune qu'une partie de ces balises ; Trans
  // ignore celles qu'une traduction ne cite pas.
  const components = {
    terms: <Link to="/conditions-d-utilisation" className={LINK} />,
    privacy: <Link to="/donnees-personnelles" className={LINK} />,
    notice: <Link to="/mentions-legales" className={LINK} />,
    // Jamais « Gérer les cookies » : le page object e2e désigne le bouton du
    // pied de page par ce nom, et un homonyme le rendrait ambigu.
    settings: (
      <button
        type="button"
        onClick={() => dispatch(consentSettingsOpened())}
        className={`${LINK} cursor-pointer`}
      />
    ),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="label-ticket text-fg-subtle">{t('label')}</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight font-bold tracking-tight text-fg">
        {t('title')}
      </h1>
      <p className="mt-3 text-lg text-fg-muted">{t('subtitle')}</p>

      <nav aria-label={t('jumpTo')} className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            {t(section.title)}
          </a>
        ))}
      </nav>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-titre`}
          className="mt-12 scroll-mt-24"
        >
          <h2 id={`${section.id}-titre`} className="font-display text-xl font-bold tracking-tight text-fg">
            {t(section.title)}
          </h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {section.questions.map((question) => (
              <details
                key={question}
                className="group rounded-2xl border border-line bg-bg-raised transition-colors open:border-line-strong"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-base font-medium text-fg [&::-webkit-details-marker]:hidden">
                  {t(`q.${question}.question`)}
                  <ChevronDown
                    className="size-5 shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-fg-muted">
                  <Trans t={t} i18nKey={`q.${question}.answer`} components={components} />
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
