import {DOCUMENT} from '@angular/common';
import type {Signal} from '@angular/core';
import {
  ElementRef,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Observable, startWith} from 'rxjs';

export interface InjectMutationOptions {
  /**
   * The DOM Node to observe for mutations. Can be an Element, ElementRef, or a CSS selector string.
   * If a string is provided, it will be queried against the document.
   * @default document.body
   */
  target?: Element | ElementRef<Element> | string;

  /**
   * An options object for the MutationObserver, specifying which mutations should be reported.
   */
  observerOptions?: MutationObserverInit;

  /**
   * Specify a custom `Injector` instance to use for dependency injection.
   */
  injector?: Injector;
}

/**
 * Creates an injectable stream of DOM mutations for a given target element.
 *
 * @param options - Configuration for the mutation observer.
 * @returns An Observable that emits an array of `MutationRecord` objects whenever the DOM mutates.
 * It synchronously emits an empty array `[]` on subscription.
 */
export function injectMutationStream(
  options?: InjectMutationOptions,
): Observable<MutationRecord[]> {
  const injector = inject(Injector);

  return runInInjectionContext(injector, () => {
    const doc = inject(DOCUMENT);
    const observerOptions = options?.observerOptions ?? {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    };

    // Resolve the target element
    let targetElement: Node;
    if (options?.target instanceof ElementRef) {
      targetElement = options.target.nativeElement;
    } else if (typeof options?.target === 'string') {
      const el = doc.querySelector(options.target);
      if (!el) {
        throw new Error(
          `[injectMutation] Element with selector "${options.target}" not found.`,
        );
      }
      targetElement = el;
    } else {
      targetElement = options?.target ?? doc.body;
    }

    const mutationObservable$ = new Observable<MutationRecord[]>(
      (subscriber) => {
        const observer = new MutationObserver((mutations) => {
          subscriber.next(mutations);
        });

        observer.observe(targetElement, observerOptions);

        // Teardown logic to disconnect the observer when unsubscribed
        return () => {
          observer.disconnect();
        };
      },
    );

    // using `startWith([])` to ensure `toSignal` gets a synchronous value on creation,
    // allowing the use of `{ requireSync: true }`.
    return mutationObservable$.pipe(startWith([]));
  });
}

/**
 * Injects a Signal that emits an array of `MutationRecord` objects whenever the DOM mutates.
 *
 * This is a powerful utility for building components that need to react to changes
 * within their own template, their content children (via Content Projection), or any other DOM element.
 *
 * @example
 * ```ts
 * import { Component, effect, ElementRef } from '@angular/core';
 * import { injectMutation } from './inject-mutation';
 *
 * @Component({
 *   selector: 'my-component',
 *   template: `<div #myTarget></div>`
 * })
 * export class MyComponent {
 *   // observe a template reference variable
 *   mutations = injectMutation({ target: inject(ElementRef) });
 *
 *   constructor() {
 *     effect(() => {
 *       // The initial value will be [], subsequent values will be MutationRecord[]
 *       if (this.mutations().length > 0) {
 *         console.log('DOM has changed:', this.mutations());
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @param options - Configuration for the mutation observer.
 * @returns A `Signal<MutationRecord[]>` that updates whenever mutations are observed.
 * The signal's initial value is an empty array `[]`.
 */
export function injectMutation(
  options?: InjectMutationOptions,
): Signal<MutationRecord[]> {
  return toSignal(injectMutationStream(options), {requireSync: true});
}
