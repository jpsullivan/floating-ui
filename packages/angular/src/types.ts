import type {
  FloatingElement,
  Middleware,
  MiddlewareData,
  Placement,
  ReferenceElement,
  Strategy,
} from '@floating-ui/dom';
import type {Signal} from '@angular/core';

export type {
  AlignedPlacement,
  Alignment,
  ArrowOptions,
  AutoPlacementOptions,
  AutoUpdateOptions,
  Axis,
  Boundary,
  ClientRectObject,
  ComputePositionConfig,
  ComputePositionReturn,
  Coords,
  DetectOverflowOptions,
  Dimensions,
  ElementContext,
  ElementRects,
  FlipOptions,
  FloatingElement,
  HideOptions,
  InlineOptions,
  Length,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  NodeScroll,
  OffsetOptions,
  Padding,
  Placement,
  Platform,
  Rect,
  ReferenceElement,
  RootBoundary,
  ShiftOptions,
  Side,
  SideObject,
  SizeOptions,
  Strategy,
  VirtualElement,
} from '@floating-ui/dom';

export type MaybeElement<T> = T | null | undefined;

export interface UseFloatingOptions<
  T extends ReferenceElement = ReferenceElement,
> {
  /**
   * Whether the floating element is open or not.
   */
  open?: boolean | Signal<boolean>;
  /**
   * Where to place the floating element relative to its reference element.
   * @default 'bottom'
   */
  placement?: Placement | Signal<Placement>;
  /**
   * The type of CSS position property to use.
   * @default 'absolute'
   */
  strategy?: Strategy | Signal<Strategy>;
  /**
   * Array of middleware objects to modify the positioning or provide data for rendering.
   */
  middleware?:
    | Array<Middleware | null | undefined | false>
    | Signal<Array<Middleware | null | undefined | false>>;
  /**
   * Whether to use `transform: translate()` for positioning instead of `top` and `left` (layout) positioning.
   * @default true
   */
  transform?: boolean | Signal<boolean>;
  /**
   * Callback to handle mounting/unmounting of the elements.
   */
  whileElementsMounted?: (
    reference: T,
    floating: FloatingElement,
    update: () => void,
  ) => () => void;
}

export interface UseFloatingReturn {
  /**
   * The x-coordinate of the floating element.
   */
  x: Signal<number>;
  /**
   * The y-coordinate of the floating element.
   */
  y: Signal<number>;
  /**
   * The stateful placement, which can be different from the initial `placement` passed as options.
   */
  placement: Signal<Placement>;
  /**
   * The stateful strategy, which can be different from the initial `strategy` passed as options.
   */
  strategy: Signal<Strategy>;
  /**
   * Additional data from middleware.
   */
  middlewareData: Signal<MiddlewareData>;
  /**
   * The boolean that let you know if the floating element has been positioned.
   */
  isPositioned: Signal<boolean>;
  /**
   * CSS styles to apply to the floating element to position it.
   */
  floatingStyles: Signal<{[key: string]: string}>;
  /**
   * The function to update the floating element's position manually.
   */
  update: () => void;
}
