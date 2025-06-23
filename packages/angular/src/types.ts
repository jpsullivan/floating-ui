import type {
  FloatingElement,
  Middleware,
  MiddlewareData,
  Placement,
  ReferenceElement,
  Strategy,
} from '@floating-ui/dom';
import type {Signal, ElementRef, WritableSignal} from '@angular/core';

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

export type FloatingEvents = {
  emit<T extends string>(event: T, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
};

export type OpenChangeReason =
  | 'outside-press'
  | 'escape-key'
  | 'ancestor-scroll'
  | 'reference-press'
  | 'click'
  | 'hover'
  | 'focus'
  | 'focus-out'
  | 'list-navigation'
  | 'safe-polygon';

export type FloatingRefs<T extends ReferenceElement = ReferenceElement> = {
  reference: WritableSignal<T | null>;
  floating: WritableSignal<FloatingElement | null>;
  setReference: (node: T | null) => void;
  setFloating: (node: FloatingElement | null) => void;
};

export type FloatingElements<T extends ReferenceElement = ReferenceElement> = {
  reference: Signal<T | null>;
  floating: Signal<FloatingElement | null>;
};

export type ElementInput<T = HTMLElement> =
  | ElementRef<T>
  | Signal<ElementRef<T> | null | undefined>
  | Signal<T | null | undefined>
  | (() => T | null | undefined);

export interface FloatingContext<
  T extends ReferenceElement = ReferenceElement,
> {
  open: Signal<boolean>;
  onOpenChange: (
    open: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => void;
  placement: Signal<Placement>;
  strategy: Signal<Strategy>;
  x: Signal<number>;
  y: Signal<number>;
  middlewareData: Signal<MiddlewareData>;
  isPositioned: Signal<boolean>;
  floatingStyles: Signal<{[key: string]: string}>;
  update: () => void;
  refs: FloatingRefs<T>;
  elements: FloatingElements<T>;
  events: FloatingEvents;
  floatingId: string;
  nodeId?: string;
}

export interface InjectFloatingOptions<
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
  /**
   * External elements to use instead of the refs.
   * Can be an object with elements, or a function that returns elements.
   */
  elements?:
    | {
        reference?: ElementInput<T>;
        floating?: ElementInput<FloatingElement>;
      }
    | (() => {
        reference?: T | null | undefined;
        floating?: FloatingElement | null | undefined;
      });
  /**
   * Callback function called when the floating element open state changes.
   */
  onOpenChange?: (
    open: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => void;
  /**
   * Unique node ID when using nested floating elements.
   */
  nodeId?: string;
  /**
   * Parent node ID for nested floating elements.
   */
  parentId?: string | Signal<string>;
}

export interface InjectFloatingReturn<
  T extends ReferenceElement = ReferenceElement,
> {
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
  /**
   * Object containing reactive reference and floating element setters.
   */
  refs: FloatingRefs<T>;
  /**
   * Object containing reactive reference and floating element signals.
   */
  elements: FloatingElements<T>;
  /**
   * The floating context object containing all state and methods.
   */
  context: FloatingContext<T>;
  /**
   * The unique node ID for this floating element in the tree.
   */
  nodeId?: string;
}
