import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import {injectLayoutMutation} from '../utils/inject-layout-mutation';

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

export interface FloatingOverlayProps {
  /**
   * Whether the overlay should lock scrolling on the document body.
   * @default false
   */
  lockScroll?: boolean;
}

/**
 * Provides base styling for a fixed overlay element to dim content or block
 * pointer events behind a floating element.
 * It's a regular `<div>`, so it can be styled via any CSS solution you prefer.
 * This is the Angular equivalent of React's FloatingOverlay component.
 * @see https://floating-ui.com/docs/FloatingOverlay
 */
@Component({
  selector: 'floating-overlay',
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingOverlayComponent {
  /**
   * Whether the overlay should lock scrolling on the document body.
   * @default false
   */
  lockScroll = input<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly layoutMutation = injectLayoutMutation();

  constructor() {
    // Handle scroll locking effect
    effect(() => {
      this.layoutMutation();

      const shouldLock = this.lockScroll();
      if (!shouldLock) return;

      lockCount++;
      if (lockCount === 1) {
        cleanup = enableScrollLock();
      }

      // cleanup function for the effect
      return () => {
        lockCount--;
        if (lockCount === 0) {
          cleanup();
        }
      };
    });

    // cleanup on component destruction
    this.destroyRef.onDestroy(() => {
      lockCount--;
      if (lockCount === 0) {
        cleanup();
      }
    });
  }
}
