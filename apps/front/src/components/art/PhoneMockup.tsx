import { CalendarRange, CarFront, House, MapPin, Search, UserRound, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../lib/cn';
import { ParkingMark } from '../ParkingMark';
import { BayThumbnail } from './BayThumbnail';

const TABS: readonly { key: string; icon: LucideIcon; active?: boolean }[] = [
  { key: 'home', icon: House },
  { key: 'search', icon: Search, active: true },
  { key: 'bookings', icon: CalendarRange },
  { key: 'account', icon: UserRound },
];

const PINS = [
  { top: '20%', left: '22%' },
  { top: '30%', left: '78%' },
  { top: '56%', left: '30%' },
  { top: '64%', left: '72%' },
] as const;

/**
 * L'écran « Rechercher » de l'app, dessiné : ses quatre onglets sont ceux de
 * `apps/mobile`, et comme les illustrations de l'accueil, il ne porte aucun
 * prix ni aucun nombre de places — un chiffre dessiné serait inventé.
 */
export const PhoneMockup = ({ className }: { className?: string }) => {
  const { t } = useTranslation('mobileApp');

  return (
    <div aria-hidden="true" className={cn('relative w-[17.5rem] shrink-0', className)}>
      <div className="relative rounded-[3.1rem] bg-asphalt-950 p-[0.6rem] shadow-[0_50px_90px_-35px_rgb(0_0_0/0.95)] ring-1 ring-white/15">
        <span className="absolute top-28 -left-[3px] h-9 w-[3px] rounded-l bg-asphalt-700" />
        <span className="absolute top-40 -left-[3px] h-14 w-[3px] rounded-l bg-asphalt-700" />
        <span className="absolute top-36 -right-[3px] h-20 w-[3px] rounded-r bg-asphalt-700" />

        <div className="relative flex aspect-[9/19.3] flex-col overflow-hidden rounded-[2.55rem] bg-asphalt-50 text-asphalt-950">
          <div className="absolute top-2.5 left-1/2 z-30 h-6 w-[5.4rem] -translate-x-1/2 rounded-full bg-asphalt-950" />

          <div className="relative z-10 bg-asphalt-50 px-4 pt-11 pb-3">
            <p className="font-display text-xl font-bold tracking-tight">{t('mockup.title')}</p>
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-asphalt-200">
              <MapPin className="size-3.5 text-signal-600" />
              <span className="text-[0.7rem] text-asphalt-500">{t('mockup.address')}</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-asphalt-200">
                <CalendarRange className="size-3 text-asphalt-500" />
                <span className="h-1.5 w-9 rounded-full bg-asphalt-200" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-asphalt-200">
                <CarFront className="size-3 text-asphalt-500" />
                <span className="h-1.5 w-6 rounded-full bg-asphalt-200" />
              </span>
            </div>
          </div>

          <div
            className="relative flex-1 bg-[#e6ecf7]"
            style={{
              backgroundImage:
                'linear-gradient(#d5ddee 1px, transparent 1px), linear-gradient(90deg, #d5ddee 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          >
            <span className="absolute top-[44%] -left-[10%] h-3 w-[130%] -rotate-[14deg] bg-white" />
            <span className="absolute top-[-10%] left-[52%] h-[130%] w-2.5 rotate-[9deg] bg-white" />
            <span className="absolute right-[6%] bottom-[10%] size-14 rounded-[42%] bg-[#d2e8d6]" />
            {PINS.map((pin) => (
              <span
                key={`${pin.top}-${pin.left}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={pin}
              >
                <ParkingMark className="size-6 drop-shadow-[0_3px_4px_rgb(0_0_0/0.25)]" />
              </span>
            ))}
            <span className="absolute top-[40%] left-[58%] grid -translate-x-1/2 -translate-y-1/2 place-items-center">
              <span className="animate-pulse-ring absolute size-9 rounded-xl bg-signal-500/40" />
              <ParkingMark className="relative size-9 drop-shadow-[0_6px_8px_rgb(0_0_0/0.3)]" />
            </span>
          </div>

          <div className="relative z-10 -mt-5 rounded-t-3xl bg-white px-3.5 pt-2 pb-2.5 shadow-[0_-12px_30px_-18px_rgb(0_0_0/0.4)]">
            <span className="mx-auto block h-1 w-9 rounded-full bg-asphalt-200" />
            {['A 12', 'B 4'].map((box) => (
              <div key={box} className="mt-2.5 flex items-center gap-2.5">
                <BayThumbnail box={box} className="h-12 w-10 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="h-2 w-4/5 rounded-full bg-asphalt-200" />
                  <span className="h-1.5 w-1/2 rounded-full bg-asphalt-100" />
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-4 border-t border-asphalt-100 bg-white px-1 pt-2 pb-5">
            {TABS.map(({ key, icon: Icon, active }) => (
              <span
                key={key}
                className={cn(
                  'flex flex-col items-center gap-0.5 text-[0.55rem] font-medium',
                  active === true ? 'text-signal-600' : 'text-asphalt-400',
                )}
              >
                <Icon className="size-4" />
                {t(`mockup.tab.${key}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
