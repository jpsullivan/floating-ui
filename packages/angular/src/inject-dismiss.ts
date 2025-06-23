import {DestroyRef, effect, inject, signal, type Signal} from '@angular/core';
import type {FloatingElement, ReferenceElement} from '@floating-ui/dom';
import {getOverflowAncestors} from '@floating-ui/dom';
import {isElement} from '@floating-ui/utils/dom';
import {type FloatingTreeManager} from './floating-tree';
import type {FloatingContext, OpenChangeReason} from './types';

function getDocument(node: Element | null) {
  return node?.ownerDocument || document;
}

const bubbleHandlerKeys = {
  pointerdown: 'onPointerDown',
  mousedown: 'onMouseDown',
  click: 'onClick',
} as const;

const captureHandlerKeys = {
  pointerdown: 'onPointerDownCapture',
  mousedown: 'onMouseDownCapture',
  click: 'onClickCapture',
} as const;

export const normalizeProp = (
  normalizable?: boolean | {escapeKey?: boolean; outsidePress?: boolean},
) => {
  return {
    escapeKey:
      typeof normalizable === 'boolean'
        ? normalizable
        : normalizable?.escapeKey ?? false,
    outsidePress:
      typeof normalizable === 'boolean'
        ? normalizable
        : normalizable?.outsidePress ?? true,
  };
};

export interface InjectDismissOptions {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: boolean;
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element.
   * @default false
   */
  referencePress?: boolean;
  /**
   * The type of event to use to determine a "press".
   * @default 'pointerdown'
   */
  referencePressEvent?: 'pointerdown' | 'mousedown' | 'click';
  /**
   * Whether to dismiss the floating element upon pressing outside of the
   * floating element.
   * @default true
   */
  outsidePress?: boolean | ((event: MouseEvent) => boolean);
  /**
   * The type of event to use to determine an outside "press".
   * @default 'pointerdown'
   */
  outsidePressEvent?: 'pointerdown' | 'mousedown' | 'click';
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: boolean;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?: boolean | {escapeKey?: boolean; outsidePress?: boolean};
  /**
   * Determines whether to use capture phase event listeners.
   */
  capture?: boolean | {escapeKey?: boolean; outsidePress?: boolean};
}

export interface ElementProps {
  reference?: {[key: string]: any};
  floating?: {[key: string]: any};
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function injectDismiss<T extends ReferenceElement = ReferenceElement>(
  context: FloatingContext<T>,
  options: InjectDismissOptions = {},
): ElementProps {
  const destroyRef = inject(DestroyRef);
  const {
    enabled = true,
    escapeKey = true,
    outsidePress: unstable_outsidePress = true,
    outsidePressEvent = 'pointerdown',
    referencePress = false,
    referencePressEvent = 'pointerdown',
    ancestorScroll = false,
    bubbles,
    capture,
  } = options;

  const outsidePressFn =
    typeof unstable_outsidePress === 'function'
      ? unstable_outsidePress
      : () => false;
  const outsidePress =
    typeof unstable_outsidePress === 'function'
      ? outsidePressFn
      : unstable_outsidePress;

  let endedOrStartedInside = false;
  const {escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles} =
    normalizeProp(bubbles);
  const {escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture} =
    normalizeProp(capture);

  let isComposing = false;
  let blurTimeout = -1;

  const closeOnEscapeKeyDown = (event: KeyboardEvent) => {
    if (!context.open() || !enabled || !escapeKey || event.key !== 'Escape') {
      return;
    }

    // Wait until IME is settled
    if (isComposing) {
      return;
    }

    if (!escapeKeyBubbles) {
      event.stopPropagation();
    }

    context.onOpenChange(false, event, 'escape-key');
  };

  const closeOnPressOutside = (event: MouseEvent) => {
    // Handle dragging for click events
    if (outsidePressEvent === 'click' && endedOrStartedInside) {
      return;
    }

    if (typeof outsidePress === 'function' && !outsidePress(event)) {
      return;
    }

    const target = event.target as Element;
    const elements = context.elements;

    const floatingEl = elements.floating();
    const referenceEl = elements.reference();

    if (
      target &&
      ((floatingEl && isElement(floatingEl) && floatingEl.contains(target)) ||
        (referenceEl && isElement(referenceEl) && referenceEl.contains(target)))
    ) {
      return;
    }

    if (!outsidePressBubbles) {
      event.stopPropagation();
    }

    context.onOpenChange(false, event, 'outside-press');
  };

  let cleanupFunctions: (() => void)[] = [];

  const cleanup = () => {
    cleanupFunctions.forEach((fn) => fn());
    cleanupFunctions = [];
  };

  effect(() => {
    if (!context.open() || !enabled) {
      cleanup();
      return;
    }

    let compositionTimeout = -1;

    const onScroll = (event: Event) => {
      context.onOpenChange(false, event, 'ancestor-scroll');
    };

    const handleCompositionStart = () => {
      window.clearTimeout(compositionTimeout);
      isComposing = true;
    };

    const handleCompositionEnd = () => {
      compositionTimeout = window.setTimeout(() => {
        isComposing = false;
      }, 0);
    };

    const doc = getDocument(context.elements.floating());

    if (escapeKey) {
      doc.addEventListener('keydown', closeOnEscapeKeyDown, escapeKeyCapture);
      doc.addEventListener('compositionstart', handleCompositionStart);
      doc.addEventListener('compositionend', handleCompositionEnd);

      cleanupFunctions.push(
        () =>
          doc.removeEventListener(
            'keydown',
            closeOnEscapeKeyDown,
            escapeKeyCapture,
          ),
        () =>
          doc.removeEventListener('compositionstart', handleCompositionStart),
        () => doc.removeEventListener('compositionend', handleCompositionEnd),
      );
    }

    if (outsidePress) {
      doc.addEventListener(
        outsidePressEvent,
        closeOnPressOutside,
        outsidePressCapture,
      );
      cleanupFunctions.push(() =>
        doc.removeEventListener(
          outsidePressEvent,
          closeOnPressOutside,
          outsidePressCapture,
        ),
      );
    }

    let ancestors: (Element | Window | VisualViewport)[] = [];

    if (ancestorScroll) {
      const reference = context.elements.reference();
      const floating = context.elements.floating();

      if (isElement(reference)) {
        ancestors = getOverflowAncestors(reference);
      }

      if (isElement(floating)) {
        ancestors = ancestors.concat(getOverflowAncestors(floating));
      }
    }

    // Filter out visual viewport
    ancestors = ancestors.filter(
      (ancestor) => ancestor !== doc.defaultView?.visualViewport,
    );

    ancestors.forEach((ancestor) => {
      ancestor.addEventListener('scroll', onScroll, {passive: true});
    });

    cleanupFunctions.push(() => {
      ancestors.forEach((ancestor) => {
        ancestor.removeEventListener('scroll', onScroll);
      });
      window.clearTimeout(compositionTimeout);
    });
  });

  destroyRef.onDestroy(cleanup);

  const referenceProps = {
    onKeyDown: closeOnEscapeKeyDown,
    ...(referencePress && {
      [bubbleHandlerKeys[referencePressEvent]]: (event: Event) => {
        context.onOpenChange(false, event, 'reference-press');
      },
      ...(referencePressEvent !== 'click' && {
        onClick: (event: Event) => {
          context.onOpenChange(false, event, 'reference-press');
        },
      }),
    }),
  };

  const floatingProps = {
    onKeyDown: closeOnEscapeKeyDown,
    onMouseDown: () => {
      endedOrStartedInside = true;
    },
    onMouseUp: () => {
      endedOrStartedInside = true;
    },
    [captureHandlerKeys[outsidePressEvent]]: () => {
      // Mark as inside Angular tree equivalent
      // This is for tracking if the event started inside
    },
    onBlurCapture: () => {
      window.clearTimeout(blurTimeout);
      blurTimeout = window.setTimeout(() => {
        // Clear timeout after blur
      });
    },
  };

  return enabled ? {reference: referenceProps, floating: floatingProps} : {};
}

// Legacy function for backward compatibility
export function injectFloatingDismiss(
  reference: Signal<ReferenceElement | null>,
  floating: Signal<FloatingElement | null>,
  open: Signal<boolean>,
  onDismiss: (restoreFocus?: boolean) => void,
  options: any = {},
  tree?: FloatingTreeManager,
  nodeId?: string,
): {cleanup: () => void} {
  // Create a minimal context for legacy support
  const legacyContext: FloatingContext = {
    open,
    onOpenChange: (open: boolean, event?: Event, reason?: OpenChangeReason) => {
      if (!open) {
        onDismiss(reason === 'escape-key');
      }
    },
    placement: signal('bottom' as any),
    strategy: signal('absolute' as any),
    x: signal(0),
    y: signal(0),
    middlewareData: signal({}),
    isPositioned: signal(false),
    floatingStyles: signal({}),
    update: () => {},
    refs: {} as any,
    elements: {
      reference,
      floating,
    },
    events: {} as any,
    floatingId: '',
    nodeId,
  };

  injectDismiss(legacyContext, {
    escapeKey: options.escapeKey ?? true,
    outsidePress: options.outsidePress ?? true,
    bubbles: {escapeKey: options.escapeKeyBubbles ?? true},
  });

  return {cleanup: () => {}};
}
