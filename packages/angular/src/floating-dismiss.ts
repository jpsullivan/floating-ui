import {effect, type Signal} from '@angular/core';
import type {FloatingElement, ReferenceElement} from '@floating-ui/dom';
import {shouldEscapeKeyBubble, type FloatingTreeManager} from './floating-tree';

function isSignal<T>(value: T | Signal<T>): value is Signal<T> {
  return typeof value === 'function';
}

function getSignalValue<T>(value: T | Signal<T>): T {
  return isSignal(value) ? value() : value;
}

export interface DismissOptions {
  /**
   * Whether to dismiss when pressing the escape key.
   * @default true
   */
  escapeKey?: boolean;
  /**
   * Whether to dismiss when clicking outside the floating element.
   * @default true
   */
  outsidePress?: boolean;
  /**
   * Whether to restore focus to the reference element when dismissed via escape key.
   * @default true
   */
  restoreFocus?: boolean;
  /**
   * Whether escape key events should bubble up to parent floating elements.
   * @default true
   */
  escapeKeyBubbles?: boolean;
}

export interface DismissHandler {
  /**
   * Cleanup function to remove event listeners.
   */
  cleanup: () => void;
}

/**
 * Creates dismiss handlers for a floating element.
 * Handles escape key dismissal with focus restoration and outside press dismissal.
 */
export function injectFloatingDismiss(
  reference: Signal<ReferenceElement | null>,
  floating: Signal<FloatingElement | null>,
  open: Signal<boolean>,
  onDismiss: (restoreFocus?: boolean) => void,
  options: DismissOptions | Signal<DismissOptions> = {},
  tree?: FloatingTreeManager,
  nodeId?: string,
): DismissHandler {
  let cleanupFunctions: (() => void)[] = [];

  const setupListeners = () => {
    // Clean up existing listeners
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions = [];

    if (!open()) return;

    const currentOptions = getSignalValue(options);
    const {
      escapeKey = true,
      outsidePress = true,
      restoreFocus = true,
      escapeKeyBubbles = true,
    } = currentOptions;

    if (escapeKey) {
      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          // Use tree-based bubbling logic if tree and nodeId are provided
          if (tree && nodeId) {
            const shouldBubble = shouldEscapeKeyBubble(
              tree,
              nodeId,
              escapeKeyBubbles,
            );
            if (!shouldBubble) {
              return; // Don't dismiss if children prevent bubbling
            }
          }

          // Always handle escape key when popover is open
          event.preventDefault();
          if (!escapeKeyBubbles) {
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
          onDismiss(restoreFocus);
        }
      };

      document.addEventListener('keydown', handleEscapeKey, true);
      cleanupFunctions.push(() =>
        document.removeEventListener('keydown', handleEscapeKey, true),
      );
    }

    if (outsidePress) {
      const handleOutsidePress = (event: MouseEvent) => {
        const target = event.target as Node;
        const referenceEl = reference();
        const floatingEl = floating();

        if (
          referenceEl &&
          floatingEl &&
          referenceEl instanceof Element &&
          floatingEl instanceof Element &&
          !referenceEl.contains(target) &&
          !floatingEl.contains(target)
        ) {
          onDismiss(false); // No focus restoration for outside press
        }
      };

      document.addEventListener('mousedown', handleOutsidePress);
      cleanupFunctions.push(() =>
        document.removeEventListener('mousedown', handleOutsidePress),
      );
    }
  };

  // Set up listeners when open state or options change
  effect(() => {
    // Access both open state and options to make effect reactive to both
    open();
    getSignalValue(options);
    setupListeners();
  });

  return {
    cleanup: () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
      cleanupFunctions = [];
    },
  };
}
