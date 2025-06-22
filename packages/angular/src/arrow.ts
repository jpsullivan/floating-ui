import {
  arrow as arrowCore,
  type ArrowOptions,
  type Middleware,
} from '@floating-ui/dom';
import type {ElementRef, Signal} from '@angular/core';

/**
 * Provides data to position an arrow element.
 * @param element The arrow element.
 * @param options The arrow middleware options.
 * @see https://floating-ui.com/docs/arrow
 */
export function arrow(
  element: Signal<Element | null> | ElementRef<Element>,
  options?: ArrowOptions,
): Middleware {
  const elementValue =
    'nativeElement' in element ? element.nativeElement : element();
  if (!elementValue) {
    throw new Error('Arrow element is required');
  }
  return arrowCore({
    element: elementValue,
    ...options,
  });
}
