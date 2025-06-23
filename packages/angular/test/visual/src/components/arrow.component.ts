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
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  type Placement,
} from '@floating-ui/dom';
import {injectFloating, createArrowPath} from '../../../../src/index';
import {ButtonComponent} from '../lib/button.component';

@Component({
  selector: 'app-arrow-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle],
  template: `
    <span class="inline-block">
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
          [ngStyle]="floatingStyles()"
          class="bg-gray-900 text-white px-3 py-2 rounded text-sm z-50 relative"
          role="tooltip"
        >
          {{ label() }}

          <!-- Arrow SVG with React-like dimensions and path -->
          <svg
            #arrow
            class="absolute text-gray-900"
            [ngStyle]="arrowStyles()"
            [attr.width]="14"
            [attr.height]="14"
            [attr.viewBox]="'0 0 14 7'"
            style="pointer-events: none;"
            aria-hidden="true"
          >
            <path [attr.d]="arrowPath()" fill="currentColor" />
          </svg>
        </div>
      }
    </span>
  `,
})
export class ArrowDemoComponent {
  label = input.required<string>();
  placement = input<Placement>('top');

  protected readonly reference =
    viewChild.required<ElementRef<HTMLElement>>('reference');
  protected readonly floating =
    viewChild<ElementRef<HTMLDivElement>>('floating');
  protected readonly arrowElement = viewChild<ElementRef<SVGElement>>('arrow');

  protected readonly isOpen = signal(false);

  private readonly floatingInstance = injectFloating({
    open: this.isOpen,
    placement: this.placement,
    elements: () => ({
      reference: this.reference()?.nativeElement,
      floating: this.floating()?.nativeElement,
    }),
    middleware: computed(() => {
      const arrowEl = this.arrowElement()?.nativeElement;
      return [
        offset(8),
        flip(),
        shift({padding: 8}),
        ...(arrowEl ? [arrow({element: arrowEl})] : []),
      ];
    }),
    whileElementsMounted: autoUpdate,
  });

  protected readonly floatingStyles = this.floatingInstance.floatingStyles;
  protected readonly middlewareData = this.floatingInstance.middlewareData;
  protected readonly placement_actual = this.floatingInstance.placement;

  protected readonly arrowPath = computed(() =>
    createArrowPath({width: 14, height: 7, tipRadius: 0}),
  );

  protected readonly arrowStyles = computed(() => {
    const arrowData = this.middlewareData().arrow;
    const actualPlacement = this.placement_actual();

    if (!arrowData) {
      return {};
    }

    const [side] = actualPlacement.split('-');
    const arrowX = arrowData.x ?? 0;
    const arrowY = arrowData.y ?? 0;

    const rotations = {
      top: '',
      bottom: 'rotate(180deg)',
      left: 'rotate(-90deg)',
      right: 'rotate(90deg)',
    };

    const positions = {
      top: {bottom: '-7px', left: `${arrowX}px`},
      bottom: {top: '-7px', left: `${arrowX}px`},
      left: {right: '-7px', top: `${arrowY}px`},
      right: {left: '-7px', top: `${arrowY}px`},
    };

    return {
      transform: rotations[side as keyof typeof rotations] || 'rotate(0deg)',
      ...positions[side as keyof typeof positions],
    };
  });

  protected showTooltip(): void {
    this.isOpen.set(true);
  }

  protected hideTooltip(): void {
    this.isOpen.set(false);
  }
}

@Component({
  selector: 'app-arrow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ArrowDemoComponent],
  template: `
    <div class="max-w-4xl">
      <h1 class="text-5xl font-bold mb-8 text-gray-800">Arrow</h1>

      <div
        class="grid place-items-center border border-slate-400 rounded lg:w-[40rem] h-[20rem] mb-8"
      >
        <div class="flex gap-6">
          <app-arrow-demo label="Top arrow tooltip" placement="top">
            <app-button>Top Arrow</app-button>
          </app-arrow-demo>

          <app-arrow-demo label="Bottom arrow tooltip" placement="bottom">
            <app-button>Bottom Arrow</app-button>
          </app-arrow-demo>

          <app-arrow-demo label="Left arrow tooltip" placement="left">
            <app-button>Left Arrow</app-button>
          </app-arrow-demo>

          <app-arrow-demo label="Right arrow tooltip" placement="right">
            <app-button>Right Arrow</app-button>
          </app-arrow-demo>
        </div>
      </div>

      <div class="prose prose-lg">
        <h2 class="text-2xl font-semibold mb-4">Features</h2>
        <ul class="space-y-2">
          <li>Triangular arrow pointing to reference element</li>
          <li>Arrow automatically rotates based on placement</li>
          <li>Arrow positioning updates with flip/shift middleware</li>
          <li>Proper arrow offset from floating element edges</li>
        </ul>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <p class="text-yellow-800">
            <strong>Note:</strong> This is a simplified arrow implementation.
            For production use, consider using SVG paths or CSS-based arrows
            with proper styling.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ArrowComponent {}
