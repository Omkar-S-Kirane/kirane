/**
 * Joins class name strings, filtering out falsy values.
 * A lightweight alternative to clsx for simple conditional class composition.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
