import { CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/**
 * Le champ tient lui-meme le lien `aria-describedby` entre l'entree, son aide et
 * son erreur : une erreur affichee sans cette liaison reste invisible au
 * lecteur d'ecran, meme quand elle est rouge et juste en dessous.
 */
export const Field = ({ label, hint, error, className, labelClassName, children }: FieldProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint === undefined ? null : hintId, error === undefined ? null : errorId]
      .filter((value): value is string => value !== null)
      .join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium text-fg', labelClassName)}>
        {label}
      </label>
      {children({ id, describedBy, invalid: error !== undefined })}
      {hint !== undefined && error === undefined && (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};
