import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

// Le contour natif est remplacé, pas supprimé : la bordure passe à l'accent et
// un halo de trois pixels l'entoure. Sans ce halo, un champ focalisé ne se
// distinguerait d'un champ survolé que par une nuance de bordure.
const shared =
  'w-full rounded-xl border border-line-strong bg-bg-raised px-3.5 text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-150 hover:border-fg-subtle focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/25 focus-visible:outline-none aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(shared, 'min-h-12', className)} {...props} />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(shared, 'min-h-28 py-3 leading-relaxed', className)} {...props} />
);
