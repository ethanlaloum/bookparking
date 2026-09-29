import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';
import { buttonVariants, type ButtonVariantProps } from './buttonVariants';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariantProps;

export const Button = ({ className, variant, size, block, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
);
