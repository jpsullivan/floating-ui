import {
  computed,
  effect,
  inject,
  signal,
  type Signal,
  DestroyRef,
  type ElementRef,
} from '@angular/core';
import type {
  FloatingElement,
  MiddlewareData,
  ReferenceElement,
} from '@floating-ui/dom';
import {computePosition} from '@floating-ui/dom';

import type {
  MaybeElement,
  UseFloatingOptions,
  UseFloatingReturn,
} from './types';
import {getDPR, roundByDPR, unwrapElement} from './utils';

function isSignal<T>(value: T | Signal<T>): value is Signal<T> {
  return value && typeof value === 'object' && 'call' in value;
}

function getSignalValue<T>(value: T | Signal<T>): T {
  return isSignal(value) ? value() : value;
}

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a reference element when it is given a certain CSS positioning strategy.
 * @param reference The reference element signal or ElementRef.
 * @param floating The floating element signal or ElementRef.
 * @param options The floating options.
 * @see https://floating-ui.com/docs/angular
 */
export function useFloating<T extends ReferenceElement = ReferenceElement>(
  reference: Signal<MaybeElement<T>> | ElementRef<T>,
  floating: Signal<MaybeElement<FloatingElement>> | ElementRef<FloatingElement>,
  options: UseFloatingOptions<T> = {},
): UseFloatingReturn {
  const destroyRef = inject(DestroyRef);

  const whileElementsMountedOption = options.whileElementsMounted;
  const openOption = computed(() => getSignalValue(options.open ?? true));
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

  const referenceElement = computed(() => {
    if ('nativeElement' in reference) {
      return unwrapElement(reference.nativeElement);
    }
    return unwrapElement(reference());
  });

  const floatingElement = computed(() => {
    if ('nativeElement' in floating) {
      return unwrapElement(floating.nativeElement);
    }
    return unwrapElement(floating());
  });

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
      isPositioned.set(open !== false);
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

  function reset() {
    if (!openOption()) {
      isPositioned.set(false);
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
    reset();
  });

  // Cleanup on destroy
  destroyRef.onDestroy(() => {
    cleanup();
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
  };
}
