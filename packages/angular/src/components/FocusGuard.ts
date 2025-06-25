import type {ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {injectLayoutMutation} from '../utils/inject-layout-mutation';
import {isSafari} from '../utils/platform';

// See Diego Haz's Sandbox for making this logic work well on Safari/iOS:
// https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/FocusTrap.tsx

export interface FocusGuardProps {
  /**
   * Tab index for the focus guard element.
   * @default 0
   */
  tabIndex?: number;
}

/**
 * Renders a hidden span element that can receive focus to help with focus management.
 * On Safari/VoiceOver, it uses a button role to ensure the focus trap works properly.
 */
@Component({
  selector: 'fui-focus-guard',
  standalone: true,
  template: `
    <span
      #guardElement
      [attr.tabindex]="tabIndex()"
      [attr.role]="role()"
      [attr.aria-hidden]="ariaHidden()"
      [attr.data-floating-ui-focus-guard]="''"
      [style]="hiddenStyles"
    >
      <ng-content />
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusGuardComponent {
  /**
   * Tab index for the focus guard element.
   * @default 0
   */
  tabIndex = input<number>(0);

  guardElement = viewChild<ElementRef<HTMLSpanElement>>('guardElement');

  private readonly layoutMutation = injectLayoutMutation();
  private readonly roleSignal = signal<'button' | undefined>(undefined);

  readonly hiddenStyles = {
    border: '0',
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: '0',
    position: 'fixed',
    'white-space': 'nowrap',
    width: '1px',
    top: '0',
    left: '0',
  };

  constructor() {
    // Set role for Safari/VoiceOver compatibility
    effect(() => {
      this.layoutMutation();

      if (isSafari()) {
        // Unlike other screen readers such as NVDA and JAWS, the virtual cursor
        // on VoiceOver does trigger the onFocus event, so we can use the focus
        // trap element. On Safari, only buttons trigger the onFocus event.
        // NB: "group" role in the Sandbox no longer appears to work, must be a
        // button role.
        this.roleSignal.set('button');
      }
    });
  }

  role = computed(() => this.roleSignal());

  ariaHidden = computed(() => {
    const role = this.role();
    return role ? undefined : true;
  });
}
