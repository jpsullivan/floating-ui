import {NgStyle} from '@angular/common';
import type {ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from '../../../../src/index';
import {ButtonComponent} from '../lib/button.component';

@Component({
  selector: 'app-popover-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle],
  template: `
    <span class="inline-block">
      <span #reference (click)="togglePopover()" class="inline-block">
        <ng-content />
      </span>

      @if (isOpen()) {
        <div
          #floating
          [ngStyle]="floatingStyles()"
          class="bg-white border border-slate-200 shadow-lg rounded-lg px-4 py-6 z-50 max-w-sm"
          role="dialog"
          [attr.aria-labelledby]="labelId"
          [attr.aria-describedby]="descriptionId"
        >
          <h2 [id]="labelId" class="text-xl font-bold mb-2 text-gray-800">
            {{ title() }}
          </h2>
          <p [id]="descriptionId" class="text-gray-600 mb-4">
            {{ description() }}
          </p>
          <button
            (click)="closePopover()"
            class="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      }
    </span>

    @if (isOpen()) {
      <div
        class="fixed inset-0 bg-black bg-opacity-25 z-40"
        (click)="closePopover()"
      ></div>
    }
  `,
})
export class PopoverDemoComponent {
  title = input.required<string>();
  description = input.required<string>();
  placement = input<Placement>('bottom');

  protected readonly reference =
    viewChild.required<ElementRef<HTMLElement>>('reference');
  protected readonly floating =
    viewChild<ElementRef<HTMLDivElement>>('floating');

  protected readonly isOpen = signal(false);
  protected readonly labelId = `popover-label-${Math.random()
    .toString(36)
    .slice(2)}`;
  protected readonly descriptionId = `popover-desc-${Math.random()
    .toString(36)
    .slice(2)}`;

  private readonly floatingInstance = useFloating(
    computed(() => this.reference().nativeElement),
    computed(() => this.floating()?.nativeElement || null),
    {
      open: this.isOpen,
      placement: this.placement,
      middleware: [offset(10), flip(), shift({padding: 8})],
      whileElementsMounted: autoUpdate,
    },
  );

  protected readonly floatingStyles = this.floatingInstance.floatingStyles;

  protected togglePopover(): void {
    this.isOpen.update((open) => !open);
  }

  protected closePopover(): void {
    this.isOpen.set(false);
  }
}

@Component({
  selector: 'app-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, PopoverDemoComponent],
  template: `
    <div class="max-w-4xl">
      <h1 class="text-5xl font-bold mb-8 text-gray-800">Popover</h1>

      <div
        class="grid place-items-center border border-slate-400 rounded lg:w-[40rem] h-[20rem] mb-8"
      >
        <div class="flex gap-4">
          <app-popover-demo
            title="Welcome!"
            description="This is a popover with some information and a close button."
            placement="top"
          >
            <app-button>Open Top Popover</app-button>
          </app-popover-demo>

          <app-popover-demo
            title="Settings"
            description="Configure your preferences here. You can close this by clicking the button or the overlay."
            placement="bottom"
          >
            <app-button>Open Bottom Popover</app-button>
          </app-popover-demo>

          <app-popover-demo
            title="Information"
            description="Here's some detailed information that you might find useful."
            placement="left"
          >
            <app-button>Open Left Popover</app-button>
          </app-popover-demo>
        </div>
      </div>

      <div class="prose prose-lg">
        <h2 class="text-2xl font-semibold mb-4">Features</h2>
        <ul class="space-y-2">
          <li>Click to toggle open/close</li>
          <li>Modal overlay with click-to-close</li>
          <li>Proper ARIA labeling for accessibility</li>
          <li>Automatic positioning with middleware</li>
          <li>Focus management</li>
        </ul>
      </div>
    </div>
  `,
})
export class PopoverComponent {}
