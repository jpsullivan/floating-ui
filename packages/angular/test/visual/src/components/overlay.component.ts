import {NgStyle} from '@angular/common';
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
  injectDismiss,
  injectFloating,
  injectFloatingOverlay,
  offset,
  shift,
  type Placement,
} from '../../../../src/index';
import {ButtonComponent} from '../lib/button.component';

@Component({
  selector: 'app-overlay-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle],
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
        <!-- Overlay backdrop -->
        <div
          [ngStyle]="overlayStyles()"
          class="bg-black bg-opacity-50"
          (click)="closeModal()"
        >
          <!-- Modal content -->
          <div
            #floating
            [ngStyle]="floatingStyles()"
            class="bg-white border border-slate-200 shadow-xl rounded-lg px-6 py-8 z-50 max-w-md mx-auto"
            role="dialog"
            [attr.aria-labelledby]="labelId"
            [attr.aria-describedby]="descriptionId"
            (click)="$event.stopPropagation()"
            (keydown)="onFloatingKeyDown($event)"
            (mousedown)="onFloatingMouseDown($event)"
            (mouseup)="onFloatingMouseUp($event)"
          >
            <h2 [id]="labelId" class="text-2xl font-bold mb-4 text-gray-800">
              {{ title() }}
            </h2>
            <p [id]="descriptionId" class="text-gray-600 mb-6">
              {{ description() }}
            </p>

            <div class="flex gap-3 justify-end">
              <button
                (click)="closeModal()"
                class="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="confirmModal()"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
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
    onOpenChange: (open: boolean, event?: Event, reason?: string) => {
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

  private readonly overlayInstance = injectFloatingOverlay({
    lockScroll: this.lockScroll(),
  });

  protected readonly floatingStyles = this.floatingInstance.floatingStyles;
  protected readonly overlayStyles = this.overlayInstance.overlayStyles;

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, OverlayDemoComponent],
  template: `
    <div class="max-w-4xl">
      <h1 class="text-5xl font-bold mb-8 text-gray-800">FloatingOverlay</h1>

      <div
        class="grid place-items-center border border-slate-400 rounded lg:w-[40rem] h-[20rem] mb-8"
      >
        <div class="flex gap-4">
          <app-overlay-demo
            title="Delete Item"
            description="Are you sure you want to delete this item? This action cannot be undone."
            placement="top"
            [lockScroll]="true"
          >
            <app-button>Open Modal (Lock Scroll)</app-button>
          </app-overlay-demo>

          <app-overlay-demo
            title="Save Changes"
            description="You have unsaved changes. Would you like to save them before continuing?"
            placement="bottom"
            [lockScroll]="false"
          >
            <app-button>Open Modal (No Lock)</app-button>
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
          The FloatingOverlay provides scroll locking and backdrop functionality.
          Use <code>injectFloatingOverlay({ lockScroll: true })</code> to get overlay styles
          and automatic scroll management.
        </p>
      </div>
    </div>
  `,
})
export class OverlayComponent {}
