import type {ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  autoUpdate,
  flip,
  FloatingOverlayComponent,
  injectDismiss,
  injectFloating,
  offset,
  shift,
  type Placement,
} from '../../../../src/index';
import {ButtonComponent} from '../lib/button.component';

@Component({
  selector: 'app-overlay-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FloatingOverlayComponent],
  template: `
    <span class="inline-block">
      <span
        #reference
        (click)="toggleModal()"
        (keydown)="onReferenceKeyDown($event)"
        class="inline-block"
      >
        <ng-content />
      </span>

      @if (isOpen()) {
        <floating-overlay
          [lockScroll]="lockScroll()"
          class="bg-black/20"
          (click)="closeModal()"
        >
          <!-- Modal content -->
          <div
            #floating
            [style.position]="floatingStyles().position"
            [style.top]="floatingStyles().top"
            [style.left]="floatingStyles().left"
            [style.transform]="floatingStyles().transform"
            class="bg-white border border-slate-200 shadow-2xl rounded-xl px-8 py-10 z-50 max-w-lg w-full mx-auto transform transition-all"
            role="dialog"
            [attr.aria-labelledby]="labelId"
            [attr.aria-describedby]="descriptionId"
            (click)="$event.stopPropagation()"
            (keydown)="onFloatingKeyDown($event)"
            (mousedown)="onFloatingMouseDown($event)"
            (mouseup)="onFloatingMouseUp($event)"
          >
            <div class="flex items-center mb-6">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                [class.bg-red-100]="lockScroll()"
                [class.bg-blue-100]="!lockScroll()"
              >
                <span
                  class="text-2xl"
                  [class.text-red-600]="lockScroll()"
                  [class.text-blue-600]="!lockScroll()"
                >
                  {{ lockScroll() ? '🔒' : '🔓' }}
                </span>
              </div>
              <div>
                <h2 [id]="labelId" class="text-2xl font-bold text-gray-800">
                  {{ title() }}
                </h2>
                <p
                  class="text-sm font-medium"
                  [class.text-red-600]="lockScroll()"
                  [class.text-blue-600]="!lockScroll()"
                >
                  {{ lockScroll() ? 'Scroll Lock: ON' : 'Scroll Lock: OFF' }}
                </p>
              </div>
            </div>

            <p [id]="descriptionId" class="text-gray-600 mb-8 leading-relaxed">
              {{ description() }}
            </p>

            <div class="flex gap-3 justify-end">
              <button
                (click)="closeModal()"
                class="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                (click)="confirmModal()"
                class="px-6 py-3 text-white rounded-lg focus:outline-none focus:ring-2 transition-colors font-medium"
                [class.bg-red-600]="lockScroll()"
                [class.hover:bg-red-700]="lockScroll()"
                [class.focus:ring-red-500]="lockScroll()"
                [class.bg-blue-600]="!lockScroll()"
                [class.hover:bg-blue-700]="!lockScroll()"
                [class.focus:ring-blue-500]="!lockScroll()"
              >
                Confirm
              </button>
            </div>
          </div>
        </floating-overlay>
      }
    </span>
  `,
})
export class OverlayDemoComponent {
  title = input.required<string>();
  description = input.required<string>();
  placement = input<Placement>('bottom');
  lockScroll = input<boolean>(true);

  protected readonly reference =
    viewChild.required<ElementRef<HTMLElement>>('reference');
  protected readonly floating =
    viewChild<ElementRef<HTMLDivElement>>('floating');

  protected readonly isOpen = signal(false);
  protected readonly labelId = `modal-label-${Math.random()
    .toString(36)
    .slice(2)}`;
  protected readonly descriptionId = `modal-desc-${Math.random()
    .toString(36)
    .slice(2)}`;

  private readonly floatingInstance = injectFloating({
    open: this.isOpen,
    placement: this.placement,
    middleware: [offset(10), flip(), shift({padding: 8})],
    whileElementsMounted: autoUpdate,
    elements: () => ({
      reference: this.reference()?.nativeElement,
      floating: this.floating()?.nativeElement,
    }),
    onOpenChange: (open: boolean, _event?: Event, reason?: string) => {
      if (!open) {
        this.isOpen.set(false);

        // Restore focus to reference element on escape key
        if (reason === 'escape-key') {
          const refEl = this.reference()?.nativeElement;
          if (refEl instanceof HTMLElement) {
            refEl.focus();
          }
        }
      }
    },
  });

  private readonly dismissProps = injectDismiss(this.floatingInstance.context, {
    escapeKey: true,
    outsidePress: true,
    bubbles: {escapeKey: true},
  });

  protected readonly floatingStyles = this.floatingInstance.floatingStyles;

  protected toggleModal(): void {
    this.isOpen.update((open) => !open);
  }

  protected closeModal(): void {
    this.isOpen.set(false);
  }

  protected confirmModal(): void {
    this.isOpen.set(false);
    // Handle confirmation logic here
    console.log('Modal confirmed');
  }

  protected onReferenceKeyDown(event: KeyboardEvent): void {
    const handler = this.dismissProps.reference?.onKeyDown;
    if (handler) {
      handler(event);
    }
  }

  protected onFloatingKeyDown(event: KeyboardEvent): void {
    const handler = this.dismissProps.floating?.onKeyDown;
    if (handler) {
      handler(event);
    }
  }

  protected onFloatingMouseDown(event: MouseEvent): void {
    const handler = this.dismissProps.floating?.onMouseDown;
    if (handler) {
      handler(event);
    }
  }

  protected onFloatingMouseUp(event: MouseEvent): void {
    const handler = this.dismissProps.floating?.onMouseUp;
    if (handler) {
      handler(event);
    }
  }
}

@Component({
  selector: 'app-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, OverlayDemoComponent],
  template: `
    <div class="max-w-4xl">
      <h1 class="text-5xl font-bold mb-8 text-gray-800">FloatingOverlay</h1>

      <!-- Instructions for testing scroll lock -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 class="text-lg font-semibold text-blue-900 mb-2">
          Testing Scroll Lock
        </h2>
        <p class="text-blue-800 mb-2">
          This page is intentionally tall to demonstrate scroll locking. Try the
          following:
        </p>
        <ol class="list-decimal list-inside text-blue-800 space-y-1">
          <li>
            <strong>With Lock:</strong> Open the first modal and try scrolling
            with your mouse wheel/trackpad - you should see the background
            content is frozen and doesn't move
          </li>
          <li>
            <strong>Without Lock:</strong> Open the second modal and try
            scrolling - you should see the background content moving behind the
            semi-transparent overlay
          </li>
          <li>
            Notice the scrollbar disappears when scroll is locked to prevent
            layout shift
          </li>
          <li>
            <strong>Look through the transparent overlay:</strong> The backdrop
            is intentionally semi-transparent so you can see the background
            content and observe whether it scrolls
          </li>
        </ol>
      </div>

      <div
        class="grid place-items-center border border-slate-400 rounded lg:w-[40rem] h-[20rem] mb-8"
      >
        <div class="flex gap-4">
          <app-overlay-demo
            title="Delete Item"
            description="Are you sure you want to delete this item? This action cannot be undone. Notice how the background doesn't scroll when this modal is open."
            placement="top"
            [lockScroll]="true"
          >
            <app-button>🔒 Open Modal (Lock Scroll)</app-button>
          </app-overlay-demo>

          <app-overlay-demo
            title="Save Changes"
            description="You have unsaved changes. Would you like to save them before continuing? The background can still be scrolled when this modal is open."
            placement="bottom"
            [lockScroll]="false"
          >
            <app-button>🔓 Open Modal (No Lock)</app-button>
          </app-overlay-demo>
        </div>
      </div>

      <div class="prose prose-lg">
        <h2 class="text-2xl font-semibold mb-4">Features</h2>
        <ul class="space-y-2">
          <li>Fixed overlay backdrop with customizable opacity</li>
          <li>Optional scroll locking for better modal behavior</li>
          <li>Click outside to dismiss</li>
          <li>Escape key to dismiss (restores focus to trigger)</li>
          <li>Proper ARIA labeling for accessibility</li>
          <li>Automatic positioning with middleware</li>
          <li>iOS-specific scroll lock handling</li>
          <li>Scrollbar width compensation</li>
        </ul>

        <h2 class="text-2xl font-semibold mb-4 mt-8">Usage</h2>
        <p>
          The FloatingOverlay provides scroll locking and backdrop
          functionality. Use
          <code
            >injectFloatingOverlay({{ '{' }} lockScroll: true {{ '}' }})</code
          >
          to get overlay styles and automatic scroll management.
        </p>

        <h2 class="text-2xl font-semibold mb-4 mt-8">
          Scroll Lock Demonstration
        </h2>
        <p class="mb-4">
          This section contains a lot of content to make the page scrollable, so
          you can properly test the scroll lock functionality.
        </p>

        <!-- Add lots of content to make page scrollable -->
        <div class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">How Scroll Lock Works</h3>
            <p class="mb-3">
              When scroll lock is enabled, the FloatingOverlay component
              prevents the user from scrolling the background content while a
              modal is open. This is especially important for mobile experiences
              and prevents disorienting scroll behavior.
            </p>
            <p class="mb-3">The implementation handles several edge cases:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Compensates for scrollbar width to prevent layout shift</li>
              <li>Uses different strategies for iOS vs other platforms</li>
              <li>Restores scroll position when the modal is closed</li>
              <li>Handles multiple overlapping modals correctly</li>
            </ul>
          </div>

          <div class="bg-yellow-50 p-6 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">Testing Instructions</h3>
            <p class="mb-3">To see the scroll lock in action:</p>
            <ol class="list-decimal list-inside space-y-2">
              <li>
                Scroll to the middle of this page so you can see content above
                and below
              </li>
              <li>
                Click "🔒 Open Modal (Lock Scroll)" and try to scroll with your
                mouse wheel or trackpad
              </li>
              <li>
                Look through the semi-transparent backdrop - notice that the
                background content is frozen and doesn't move
              </li>
              <li>Close the modal and try "🔓 Open Modal (No Lock)" instead</li>
              <li>
                Try scrolling again - you should see the background content
                moving behind the transparent overlay
              </li>
              <li>
                Also notice that the browser scrollbar disappears when scroll
                lock is enabled
              </li>
            </ol>
          </div>

          <div class="bg-green-50 p-6 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">Implementation Details</h3>
            <p class="mb-3">
              The scroll lock is implemented by setting
              <code>overflow: hidden</code>
              on the document body, but with additional logic to handle
              platform-specific behavior and scrollbar compensation.
            </p>
            <p class="mb-3">Key implementation features:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Reference counting for nested modals</li>
              <li>CSS custom property for scrollbar width</li>
              <li>Visual viewport API support for mobile browsers</li>
              <li>Automatic cleanup on component destruction</li>
            </ul>
          </div>

          <!-- Add more padding content to ensure page is tall enough -->
          <div class="space-y-4">
            <p class="text-gray-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            <p class="text-gray-600">
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum.
            </p>
            <p class="text-gray-600">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem
              accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
              quae ab illo inventore veritatis et quasi architecto beatae vitae
              dicta sunt explicabo.
            </p>
            <p class="text-gray-600">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit
              aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt.
            </p>
            <p class="text-gray-600">
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet,
              consectetur, adipisci velit, sed quia non numquam eius modi
              tempora incidunt ut labore et dolore magnam aliquam quaerat
              voluptatem.
            </p>
          </div>

          <div class="bg-blue-50 p-6 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">End of Demo</h3>
            <p>
              You've reached the end of the scroll lock demonstration. Try
              scrolling back to the top and testing the modals again to see the
              difference between locked and unlocked scroll behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OverlayComponent {}
