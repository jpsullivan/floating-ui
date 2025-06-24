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
import type {Alignment, ReferenceElement, Side} from '@floating-ui/dom';
import {getComputedStyle} from '@floating-ui/utils/dom';
import type {FloatingContext} from '../types';
import {injectLayoutMutation} from '../utils/inject-layout-mutation';

export interface FloatingArrowProps<
  T extends ReferenceElement = ReferenceElement,
> {
  /**
   * The floating context.
   */
  context: FloatingContext<T>;
  /**
   * Width of the arrow.
   * @default 14
   */
  width?: number;
  /**
   * Height of the arrow.
   * @default 7
   */
  height?: number;
  /**
   * The corner radius (rounding) of the arrow tip.
   * @default 0 (sharp)
   */
  tipRadius?: number;
  /**
   * Forces a static offset over dynamic positioning under a certain condition.
   * If the shift() middleware causes the popover to shift, this value will be
   * ignored.
   */
  staticOffset?: string | number | null;
  /**
   * Custom path string.
   */
  d?: string;
  /**
   * Fill color of the arrow.
   */
  fill?: string;
  /**
   * Stroke (border) color of the arrow.
   */
  stroke?: string;
  /**
   * Stroke (border) width of the arrow.
   */
  strokeWidth?: number;
}

/**
 * Renders a pointing arrow triangle.
 * @see https://floating-ui.com/docs/FloatingArrow
 */
@Component({
  selector: 'fui-floating-arrow',
  template: `
    @if (shouldRender()) {
      <svg
        #arrowElement
        [attr.aria-hidden]="true"
        [attr.width]="svgWidth()"
        [attr.height]="width()"
        [attr.viewBox]="viewBox()"
        [style]="arrowStyles()"
      >
        @if (computedStrokeWidth() > 0) {
          <path
            [attr.clip-path]="'url(#' + clipPathId() + ')'"
            fill="none"
            [attr.stroke]="stroke()"
            [attr.stroke-width]="computedStrokeWidth() + (d() ? 0 : 1)"
            [attr.d]="dValue()"
          />
        }
        <path
          [attr.stroke]="computedStrokeWidth() && !d() ? fill() : 'none'"
          [attr.d]="dValue()"
          [attr.fill]="fill()"
        />
        <clipPath [attr.id]="clipPathId()">
          <rect
            [attr.x]="-halfStrokeWidth()"
            [attr.y]="halfStrokeWidth() * (isCustomShape() ? -1 : 1)"
            [attr.width]="width() + computedStrokeWidth()"
            [attr.height]="width()"
          />
        </clipPath>
      </svg>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingArrowComponent {
  /**
   * The floating context.
   */
  context = input.required<FloatingContext<any>>();

  /**
   * Width of the arrow.
   * @default 14
   */
  width = input<number>(14);

  /**
   * Height of the arrow.
   * @default 7
   */
  height = input<number>(7);

  /**
   * The corner radius (rounding) of the arrow tip.
   * @default 0 (sharp)
   */
  tipRadius = input<number>(0);

  /**
   * Stroke (border) width of the arrow.
   * @default 0
   */
  strokeWidth = input<number>(0);

  /**
   * Forces a static offset over dynamic positioning under a certain condition.
   */
  staticOffset = input<string | number | null>();

  /**
   * Stroke (border) color of the arrow.
   */
  stroke = input<string>();

  /**
   * Custom path string.
   */
  d = input<string>();

  /**
   * Fill color of the arrow.
   * @default 'black'
   */
  fill = input<string>('black');

  arrowElement = viewChild<ElementRef<SVGSVGElement>>('arrowElement');

  private readonly layoutMutation = injectLayoutMutation();
  private readonly isRTL = signal(false);

  // Generate unique clip path ID
  private static idCounter = 0;
  readonly clipPathId = signal(
    `floating-arrow-clip-${++FloatingArrowComponent.idCounter}`,
  );

  constructor() {
    // Track RTL direction changes
    effect(() => {
      this.layoutMutation();
      const floating = this.context().elements.floating();
      if (!floating) return;

      const computedStyle = getComputedStyle(floating);
      this.isRTL.set(computedStyle.direction === 'rtl');
    });
  }

  shouldRender = computed(() => {
    return !!this.context().elements.floating();
  });

  // Computed values for positioning and styling
  computedStrokeWidth = computed(() => this.strokeWidth() * 2);
  halfStrokeWidth = computed(() => this.computedStrokeWidth() / 2);
  isCustomShape = computed(() => !!this.d());

  svgX = computed(() => (this.width() / 2) * (this.tipRadius() / -8 + 1));
  svgY = computed(() => ((this.height() / 2) * this.tipRadius()) / 4);

  svgWidth = computed(() => {
    return this.isCustomShape()
      ? this.width()
      : this.width() + this.computedStrokeWidth();
  });

  viewBox = computed(() => {
    const width = this.width();
    const height = this.height();
    return `0 0 ${width} ${height > width ? height : width}`;
  });

  placement = computed(() => {
    const placement = this.context().placement();
    return placement.split('-') as [Side, Alignment?];
  });

  side = computed(() => this.placement()[0]);
  alignment = computed(() => this.placement()[1]);
  isVerticalSide = computed(() => {
    const side = this.side();
    return side === 'top' || side === 'bottom';
  });

  computedStaticOffset = computed(() => {
    const staticOffset = this.staticOffset();
    const middlewareData = this.context().middlewareData();
    const shift = middlewareData.shift;
    const isVerticalSide = this.isVerticalSide();

    if ((isVerticalSide && shift?.x) || (!isVerticalSide && shift?.y)) {
      return null;
    }
    return staticOffset;
  });

  yOffsetProp = computed(() => {
    const computedStaticOffset = this.computedStaticOffset();
    const alignment = this.alignment();
    return computedStaticOffset && alignment === 'end' ? 'bottom' : 'top';
  });

  xOffsetProp = computed(() => {
    const computedStaticOffset = this.computedStaticOffset();
    const alignment = this.alignment();
    const isRTL = this.isRTL();

    let prop = computedStaticOffset && alignment === 'end' ? 'right' : 'left';
    if (computedStaticOffset && isRTL) {
      prop = alignment === 'end' ? 'left' : 'right';
    }
    return prop;
  });

  arrowPosition = computed(() => {
    const middlewareData = this.context().middlewareData();
    const arrow = middlewareData.arrow;
    const computedStaticOffset = this.computedStaticOffset();

    const arrowX = arrow?.x != null ? computedStaticOffset || arrow.x : '';
    const arrowY = arrow?.y != null ? computedStaticOffset || arrow.y : '';

    return {x: arrowX, y: arrowY};
  });

  dValue = computed(() => {
    const customD = this.d();
    if (customD) return customD;

    const width = this.width();
    const height = this.height();
    const svgX = this.svgX();
    const svgY = this.svgY();

    return (
      'M0,0' +
      ` H${width}` +
      ` L${width - svgX},${height - svgY}` +
      ` Q${width / 2},${height} ${svgX},${height - svgY}` +
      ' Z'
    );
  });

  rotation = computed(() => {
    const side = this.side();
    const isCustomShape = this.isCustomShape();

    const rotations = {
      top: isCustomShape ? 'rotate(180deg)' : '',
      left: isCustomShape ? 'rotate(90deg)' : 'rotate(-90deg)',
      bottom: isCustomShape ? '' : 'rotate(180deg)',
      right: isCustomShape ? 'rotate(-90deg)' : 'rotate(90deg)',
    };

    return rotations[side];
  });

  arrowStyles = computed(() => {
    const side = this.side();
    const isVerticalSide = this.isVerticalSide();
    const isCustomShape = this.isCustomShape();
    const computedStrokeWidth = this.computedStrokeWidth();
    const xOffsetProp = this.xOffsetProp();
    const yOffsetProp = this.yOffsetProp();
    const arrowPosition = this.arrowPosition();
    const rotation = this.rotation();

    const sideValue =
      isVerticalSide || isCustomShape
        ? '100%'
        : `calc(100% - ${computedStrokeWidth / 2}px)`;

    return {
      position: 'absolute',
      'pointer-events': 'none',
      [xOffsetProp]: arrowPosition.x,
      [yOffsetProp]: arrowPosition.y,
      [side]: sideValue,
      transform: rotation,
    };
  });
}
