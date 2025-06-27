import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with Tailwind CSS specific merging
 * Uses clsx for conditional classes and tailwind-merge to properly merge Tailwind classes
 * @param {...string} inputs - Class names or conditional objects
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}