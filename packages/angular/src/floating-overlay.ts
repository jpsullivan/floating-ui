import {DestroyRef, effect, inject, signal, type Signal} from '@angular/core';

let lockCount = 0;
const scrollbarProperty = '--floating-ui-scrollbar-width';

function getPlatform(): string {
  return navigator.platform || 'unknown';
}

function enableScrollLock(): () => void {
  const platform = getPlatform();
  const isIOS =
    /iP(hone|ad|od)|iOS/.test(platform) ||
    // iPads can claim to be MacIntel
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const bodyStyle = document.body.style;
  // RTL <body> scrollbar
  const scrollbarX =
    Math.round(document.documentElement.getBoundingClientRect().left) +
    document.documentElement.scrollLeft;
  const paddingProp = scrollbarX ? 'paddingLeft' : 'paddingRight';
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  const scrollX = bodyStyle.left ? parseFloat(bodyStyle.left) : window.scrollX;
  const scrollY = bodyStyle.top ? parseFloat(bodyStyle.top) : window.scrollY;

  bodyStyle.overflow = 'hidden';
  bodyStyle.setProperty(scrollbarProperty, `${scrollbarWidth}px`);

  if (scrollbarWidth) {
    (bodyStyle as any)[paddingProp] = `${scrollbarWidth}px`;
  }

  // Only iOS doesn't respect `overflow: hidden` on document.body, and this
  // technique has fewer side effects.
  if (isIOS) {
    // iOS 12 does not support `visualViewport`.
    const offsetLeft = window.visualViewport?.offsetLeft || 0;
    const offsetTop = window.visualViewport?.offsetTop || 0;

    Object.assign(bodyStyle, {
      position: 'fixed',
      top: `${-(scrollY - Math.floor(offsetTop))}px`,
      left: `${-(scrollX - Math.floor(offsetLeft))}px`,
      right: '0',
    });
  }

  return () => {
    Object.assign(bodyStyle, {
      overflow: '',
      [paddingProp]: '',
    });
    bodyStyle.removeProperty(scrollbarProperty);

    if (isIOS) {
      Object.assign(bodyStyle, {
        position: '',
        top: '',
        left: '',
        right: '',
      });
      window.scrollTo(scrollX, scrollY);
    }
  };
}

let cleanup = () => {};

export interface FloatingOverlayOptions {
  /**
   * Whether the overlay should lock scrolling on the document body.
   * @default false
   */
  lockScroll?: boolean;
}

export interface FloatingOverlayStyles {
  position: string;
  overflow: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Creates a floating overlay that provides base styling for a fixed overlay element
 * to dim content or block pointer events behind a floating element.
 * This is the Angular equivalent of React's FloatingOverlay component.
 * @param options Configuration options for the overlay
 * @see https://floating-ui.com/docs/FloatingOverlay
 */
export function injectFloatingOverlay(options: FloatingOverlayOptions = {}): {
  overlayStyles: Signal<FloatingOverlayStyles>;
} {
  const destroyRef = inject(DestroyRef);
  const {lockScroll = false} = options;

  const lockScrollSignal = signal(lockScroll);

  const overlayStyles = signal<FloatingOverlayStyles>({
    position: 'fixed',
    overflow: 'auto',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  effect(() => {
    const shouldLock = lockScrollSignal();

    if (!shouldLock) return;

    lockCount++;

    if (lockCount === 1) {
      cleanup = enableScrollLock();
    }

    // Cleanup function for the effect
    return () => {
      lockCount--;
      if (lockCount === 0) {
        cleanup();
      }
    };
  });

  destroyRef.onDestroy(() => {
    lockCount--;
    if (lockCount === 0) {
      cleanup();
    }
  });

  return {
    overlayStyles: overlayStyles.asReadonly(),
  };
}
