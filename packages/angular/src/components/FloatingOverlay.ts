import {ChangeDetectionStrategy, Component, effect, input} from '@angular/core';
import {injectFloatingOverlay} from '../floating-overlay';
import {injectMutation} from '../utils/inject-mutation';

/**
 * A standalone Angular component that provides base styling for a fixed overlay element
 * to dim content or block pointer events behind a floating element.
 * This is the Angular equivalent of React's FloatingOverlay component.
 * @see https://floating-ui.com/docs/FloatingOverlay
 */
@Component({
  selector: 'floating-overlay',
  template: `
    <div [ngStyle]="overlayStyles()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingOverlayComponent {
  /**
   * Whether the overlay should lock scrolling on the document body.
   * @default false
   */
  lockScroll = input<boolean>(false);

  private readonly mutations = injectMutation({
    observerOptions: {
      attributes: true,
      childList: true,
      subtree: true,
    },
  });

  private readonly overlayInstance = injectFloatingOverlay({
    lockScroll: this.lockScroll(),
  });

  protected readonly overlayStyles = this.overlayInstance.overlayStyles;

  constructor() {
    effect(() => {
      const mutationRecords = this.mutations();
      if (mutationRecords.length > 0) {
        // React to DOM mutations that might affect overlay behavior
        // This ensures the overlay properly handles dynamic changes to the DOM
        // such as content changes that might affect scrollbar calculations
        const hasRelevantChanges = mutationRecords.some(
          (record) =>
            record.type === 'childList' ||
            (record.type === 'attributes' &&
              (record.attributeName === 'style' ||
                record.attributeName === 'class')),
        );

        if (hasRelevantChanges && this.lockScroll()) {
          // Trigger change detection to ensure overlay styles are recalculated
          // when DOM changes occur that might affect scrollbar visibility
        }
      }
    });
  }
}
