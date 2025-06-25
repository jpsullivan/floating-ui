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
  injectFloating,
  offset,
  shift,
  type Placement,
} from '../../../../src/index';
import {ButtonComponent} from '../lib/button.component';

@Component({
  selector: 'app-tooltip-demo',
  template: `
    <span
      #reference
      (mouseenter)="showTooltip()"
      (mouseleave)="hideTooltip()"
      (focus)="showTooltip()"
      (blur)="hideTooltip()"
      class="inline-block"
    >
      <ng-content />
    </span>

    @if (isOpen()) {
      <div
        #floating
        [style]="floatingStyles()"
        class="bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-50 transition-opacity duration-200"
        [class]="{
          'opacity-100': isOpen(),
          'opacity-0': !isOpen()
        }"
        role="tooltip"
      >
        {{ label() }}
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDemoComponent {
  label = input.required<string>();
  placement = input<Placement>('top');

  protected readonly reference =
    viewChild.required<ElementRef<HTMLElement>>('reference');
  protected readonly floating =
    viewChild<ElementRef<HTMLDivElement>>('floating');

  protected readonly isOpen = signal(false);

  private readonly floatingInstance = injectFloating({
    open: this.isOpen,
    placement: this.placement,
    elements: () => ({
      reference: this.reference().nativeElement,
      floating: this.floating()?.nativeElement,
    }),
    middleware: [offset(8), flip(), shift({padding: 8})],
    whileElementsMounted: autoUpdate,
  });

  protected readonly floatingStyles = this.floatingInstance.floatingStyles;

  protected showTooltip(): void {
    this.isOpen.set(true);
  }

  protected hideTooltip(): void {
    this.isOpen.set(false);
  }
}

@Component({
  selector: 'app-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, TooltipDemoComponent],
  template: `
    <div class="max-w-4xl">
      <h1 class="text-5xl font-bold mb-8 text-gray-800">Tooltip</h1>

      <div
        class="grid place-items-center border border-slate-400 rounded lg:w-[40rem] h-[20rem] mb-8"
      >
        <div class="flex gap-4">
          <app-tooltip-demo label="This is a top tooltip" placement="top">
            <app-button>Top Tooltip</app-button>
          </app-tooltip-demo>

          <app-tooltip-demo label="This is a bottom tooltip" placement="bottom">
            <app-button>Bottom Tooltip</app-button>
          </app-tooltip-demo>

          <app-tooltip-demo label="This is a left tooltip" placement="left">
            <app-button>Left Tooltip</app-button>
          </app-tooltip-demo>

          <app-tooltip-demo label="This is a right tooltip" placement="right">
            <app-button>Right Tooltip</app-button>
          </app-tooltip-demo>
        </div>
      </div>

      <div class="prose prose-lg">
        <h2 class="text-2xl font-semibold mb-4">Features</h2>
        <ul class="space-y-2">
          <li>Hover and focus interactions</li>
          <li>Automatic positioning with flip and shift</li>
          <li>Smooth transitions</li>
          <li>Accessible with proper ARIA attributes</li>
        </ul>
      </div>
    </div>
  `,
})
export class TooltipComponent {}
