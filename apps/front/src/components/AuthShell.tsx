import type { ReactNode } from 'react';

import { ParkingMark } from './ParkingMark';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => (
  <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
    <ParkingMark className="size-9" />
    <h1 className="mt-6 font-display text-3xl font-bold text-fg">{title}</h1>
    <p className="mt-2 text-fg-muted">{subtitle}</p>
    <div className="mt-8 flex flex-col gap-4">{children}</div>
    <div className="mt-8 border-t border-line pt-5 text-sm text-fg-muted">{footer}</div>
  </div>
);
