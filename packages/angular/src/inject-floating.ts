import {
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type {
  FloatingElement,
  MiddlewareData,
  ReferenceElement,
} from '@floating-ui/dom';
import {computePosition} from '@floating-ui/dom';

import {injectFloatingDismiss} from './floating-dismiss';
import {injectFloatingNode} from './floating-tree';
import {signalProxy} from './signal-proxy';
import type {
  ElementInput,
  FloatingContext,
  FloatingElements,
  FloatingEvents,
  FloatingRefs,
  InjectFloatingOptions,
  InjectFloatingReturn,
  OpenChangeReason,
} from './types';
import {getDPR, roundByDPR, unwrapElement} from './utils';

function isSignal<T>(value: T | Signal<T>): value is Signal<T> {
  return typeof value === 'function';
}

function getSignalValue<T>(value: T | Signal<T>): T {
  return isSignal(value) ? value() : value;
}

function createFloatingEvents(): FloatingEvents {
  const listeners = new Map<string, Set<(data: any) => void>>();

  return {
    emit<T extends string>(event: T, data?: any) {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((handler) => handler(data));
      }
    },
    on(event: string, handler: (data: any) => void) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler);
    },
    off(event: string, handler: (data: any) => void) {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(handler);
      }
    },
  };
}

let floatingIdCounter = 0;
function generateFloatingId(): string {
  return `floating-ui-${++floatingIdCounter}`;
}

function normalizeElementInput<T = HTMLElement>(
  input: ElementInput<T> | undefined,
): Signal<T | null> {
  if (!input) {
    return signal(null);
  }

  // If it's a signal, check what it contains
  if (isSignal(input)) {
    return computed(() => {
      const value = input();
      if (!value) return null;

      // If signal contains ElementRef, extract nativeElement
      if (typeof value === 'object' && 'nativeElement' in value) {
        return unwrapElement(value.nativeElement) as T | null;
      }

      // Otherwise assume it's the element directly
      return unwrapElement(value) as T | null;
    });
  }

  // If it's an ElementRef, convert to signal
  if (input && typeof input === 'object' && 'nativeElement' in input) {
    return computed(() => unwrapElement(input.nativeElement) as T | null);
  }

  // If it's a function, convert to computed signal
  if (typeof input === 'function') {
    return computed(() => {
      const result = input();
      return result ? (unwrapElement(result) as T | null) : null;
    });
  }

  // Fallback for direct elements
  return signal(null);
}

/**
 * Provides data to position a floating element and context to add interactions.
 * @param options The floating options.
 * @see https://floating-ui.com/docs/angular
 */
export function injectFloating<T extends ReferenceElement = ReferenceElement>(
  options: InjectFloatingOptions<T> = {},
): InjectFloatingReturn<T> {
  const destroyRef = inject(DestroyRef);
  const floatingId = generateFloatingId();
  const events = createFloatingEvents();

  const whileElementsMountedOption = options.whileElementsMounted;
  const openOption = computed(() => getSignalValue(options.open ?? false));
  const middlewareOption = computed(() =>
    getSignalValue(options.middleware ?? []),
  );
  const placementOption = computed(() =>
    getSignalValue(options.placement ?? 'bottom'),
  );
  const strategyOption = computed(() =>
    getSignalValue(options.strategy ?? 'absolute'),
  );
  const transformOption = computed(() =>
    getSignalValue(options.transform ?? true),
  );

  // Create internal element signals
  const _referenceElement: WritableSignal<T | null> = signal(null);
  const _floatingElement: WritableSignal<FloatingElement | null> = signal(null);

  // Handle external elements - support both object and function patterns
  const elementsSignal = computed(() => {
    if (!options.elements) {
      return {reference: null, floating: null};
    }

    // If elements is a function, call it to get the current elements
    if (typeof options.elements === 'function') {
      const result = options.elements();
      return {
        reference: result.reference
          ? (unwrapElement(result.reference) as T | null)
          : null,
        floating: result.floating ? unwrapElement(result.floating) : null,
      };
    }

    // If elements is an object, use the existing normalization approach
    const refEl = options.elements.reference
      ? normalizeElementInput(options.elements.reference)()
      : null;
    const floatEl = options.elements.floating
      ? normalizeElementInput(options.elements.floating)()
      : null;

    return {
      reference: refEl,
      floating: floatEl,
    };
  });

  // Use signalProxy to make elements reactive
  const reactiveElements = signalProxy(elementsSignal);

  const referenceElement = computed(() => {
    return reactiveElements.reference() || _referenceElement();
  });

  const floatingElement = computed(() => {
    return reactiveElements.floating() || _floatingElement();
  });

  // Create refs object
  const refs: FloatingRefs<T> = {
    reference: _referenceElement,
    floating: _floatingElement,
    setReference: (node: T | null) => {
      _referenceElement.set(node);
    },
    setFloating: (node: FloatingElement | null) => {
      _floatingElement.set(node);
    },
  };

  // Create elements object
  const elements: FloatingElements<T> = {
    reference: referenceElement,
    floating: floatingElement,
  };

  const x = signal(0);
  const y = signal(0);
  const strategy = signal(strategyOption());
  const placement = signal(placementOption());
  const middlewareData = signal<MiddlewareData>({});
  const isPositioned = signal(false);

  const floatingStyles = computed(() => {
    const initialStyles = {
      position: strategy(),
      left: '0',
      top: '0',
    };

    if (!floatingElement()) {
      return initialStyles;
    }

    const xVal = roundByDPR(floatingElement()!, x());
    const yVal = roundByDPR(floatingElement()!, y());

    if (transformOption()) {
      return {
        ...initialStyles,
        transform: `translate(${xVal}px, ${yVal}px)`,
        ...(getDPR(floatingElement()!) >= 1.5 && {willChange: 'transform'}),
      };
    }

    return {
      position: strategy(),
      left: `${xVal}px`,
      top: `${yVal}px`,
    };
  });

  let whileElementsMountedCleanup: (() => void) | undefined;
  let dismissHandler: {cleanup: () => void} | undefined;

  // Set up tree node for nested element management
  const parentIdOption = computed(() =>
    getSignalValue(options.parentId ?? undefined),
  );
  const {
    nodeId,
    tree,
    cleanup: nodeCleanup,
  } = injectFloatingNode(openOption, parentIdOption());

  // Context needs to be created after all signals are defined
  const context: FloatingContext<T> = {
    open: openOption,
    onOpenChange: (open: boolean, event?: Event, reason?: OpenChangeReason) => {
      options.onOpenChange?.(open, event, reason);
    },
    placement: placement.asReadonly(),
    strategy: strategy.asReadonly(),
    x: x.asReadonly(),
    y: y.asReadonly(),
    middlewareData: middlewareData.asReadonly(),
    isPositioned: isPositioned.asReadonly(),
    floatingStyles,
    update,
    refs,
    elements,
    events,
    floatingId,
    nodeId,
  };

  // Set up dismiss functionality if enabled
  if (options.dismiss && (options.onDismiss || options.onOpenChange)) {
    const dismissOption = computed(() => getSignalValue(options.dismiss ?? {}));

    const referenceSignal = computed(() => {
      const el = referenceElement();
      return el instanceof HTMLElement ? el : null;
    });

    const floatingSignal = computed(() => {
      const el = floatingElement();
      return el instanceof HTMLElement ? el : null;
    });

    dismissHandler = injectFloatingDismiss(
      referenceSignal,
      floatingSignal,
      openOption,
      (restoreFocus = false) => {
        if (restoreFocus) {
          // Restore focus to reference element
          const refEl = referenceElement();
          if (refEl instanceof HTMLElement) {
            refEl.focus();
          }
        }
        options.onDismiss?.(restoreFocus);
        context.onOpenChange(false, undefined, 'outside-press');
      },
      dismissOption,
      tree,
      nodeId,
    );
  }

  function update() {
    const refEl = referenceElement();
    const floatEl = floatingElement();

    if (refEl == null || floatEl == null) {
      return;
    }

    const open = openOption();

    computePosition(refEl, floatEl, {
      middleware: middlewareOption(),
      placement: placementOption(),
      strategy: strategyOption(),
    }).then((position) => {
      x.set(position.x);
      y.set(position.y);
      strategy.set(position.strategy);
      placement.set(position.placement);
      middlewareData.set(position.middlewareData);
      /**
       * The floating element's position may be recomputed while it's closed
       * but still mounted (such as when transitioning out). To ensure
       * `isPositioned` will be `false` initially on the next open, avoid
       * setting it to `true` when `open === false` (must be specified).
       */
      isPositioned.set(open);
    });
  }

  function cleanup() {
    if (typeof whileElementsMountedCleanup === 'function') {
      whileElementsMountedCleanup();
      whileElementsMountedCleanup = undefined;
    }
  }

  function attach() {
    cleanup();

    if (whileElementsMountedOption === undefined) {
      update();
      return;
    }

    const refEl = referenceElement();
    const floatEl = floatingElement();

    if (refEl != null && floatEl != null) {
      whileElementsMountedCleanup = whileElementsMountedOption(
        refEl as T,
        floatEl,
        update,
      );
      return;
    }
  }

  // Watch for changes and update accordingly
  effect(() => {
    middlewareOption();
    placementOption();
    strategyOption();
    openOption();
    update();
  });

  effect(() => {
    referenceElement();
    floatingElement();
    attach();
  });

  effect(() => {
    openOption();
  });

  // Cleanup on destroy
  destroyRef.onDestroy(() => {
    cleanup();
    dismissHandler?.cleanup();
    nodeCleanup();
  });

  return {
    x: x.asReadonly(),
    y: y.asReadonly(),
    strategy: strategy.asReadonly(),
    placement: placement.asReadonly(),
    middlewareData: middlewareData.asReadonly(),
    isPositioned: isPositioned.asReadonly(),
    floatingStyles,
    update,
    refs,
    elements,
    context,
    nodeId,
  };
}
