/**
 * Generates a unique ID for internal use
 */
export function generateId(): string {
  return `floating-ui-${Math.random().toString(36).slice(2, 11)}`;
}
