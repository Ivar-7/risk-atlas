import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * shadcn/ui convention: conditional class names merged with Tailwind conflict
 * resolution, so a caller-supplied `className` always wins over a variant's
 * default (e.g. `rounded-full` overriding `rounded-md`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}