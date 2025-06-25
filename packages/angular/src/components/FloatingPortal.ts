import type {ElementRef, OnDestroy} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {isElement} from '@floating-ui/utils/dom';
import {createAttribute} from '../utils';
import {generateId} from '../utils/id';
import {FloatingPortalOutlet, type PortalContent} from '../utils/portal-outlet';
import {
  disableFocusInside,
  enableFocusInside,
  getNextTabbable,
  getPreviousTabbable,
  isOutsideEvent,
} from '../utils/tabbable';
import {FocusGuardComponent} from './FocusGuard';

export interface FloatingPortalProps {
  /**
   * Optionally selects the node with the id if it exists, or create it and
   * append it to the specified `root` (by default `document.body`).
   */
  id?: string;
  /**
   * Specifies the root node the portal container will be appended to.
   */
  root?: HTMLElement | null | ElementRef<HTMLElement | null>;
  /**
   * When using non-modal focus management, this will preserve the tab order
   * context based on the tree instead of the DOM tree.
   * @default true
   */
  preserveTabOrder?: boolean;
}

export type FocusManagerState = {
  modal: boolean;
  open: boolean;
  onOpenChange(open: boolean, event?: Event, reason?: string): void;
  domReference: Element | null;
  closeOnFocusOut: boolean;
} | null;

/**
 * Portal component with enhanced lifecycle management and error handling.
 * Inspired by Angular CDK Portal implementation patterns for robust DOM manipulation.
 */
@Component({
  selector: 'fui-floating-portal',
  standalone: true,
  imports: [FocusGuardComponent],
  template: `
    @if (shouldRenderGuards() && isAttached()) {
      <fui-focus-guard
        #beforeOutsideRef
        [attr.data-type]="'outside'"
        (focus)="onBeforeOutsideFocus($event)"
      />
    }

    @if (shouldRenderGuards() && isAttached()) {
      <span [attr.aria-owns]="portalNode()?.id" [style]="hiddenStyles"></span>
    }

    @if (shouldRenderGuards() && isAttached()) {
      <fui-focus-guard
        #afterOutsideRef
        [attr.data-type]="'outside'"
        (focus)="onAfterOutsideFocus($event)"
      />
    }

    <div #contentTemplate style="display: none;">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingPortalComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  /**
   * Optionally selects the node with the id if it exists, or create it and
   * append it to the specified `root` (by default `document.body`).
   */
  id = input<string>();

  /**
   * Specifies the root node the portal container will be appended to.
   */
  root = input<HTMLElement | null | ElementRef<HTMLElement | null>>();

  /**
   * When using non-modal focus management, this will preserve the tab order
   * context based on the tree instead of the DOM tree.
   */
  preserveTabOrder = input<boolean>(true);

  // Portal management
  private readonly _portalOutlet = signal<FloatingPortalOutlet | null>(null);
  private readonly _portalNode = signal<HTMLElement | null>(null);
  private readonly _isAttached = signal(false);

  // Public readonly signals
  readonly portalNode = this._portalNode.asReadonly();
  readonly isAttached = this._isAttached.asReadonly();

  // Focus manager state
  private readonly focusManagerState = signal<FocusManagerState>(null);

  // Template refs
  beforeOutsideRef = viewChild<ElementRef<HTMLSpanElement>>('beforeOutsideRef');
  afterOutsideRef = viewChild<ElementRef<HTMLSpanElement>>('afterOutsideRef');
  beforeInsideRef = signal<ElementRef<HTMLSpanElement> | null>(null);
  afterInsideRef = signal<ElementRef<HTMLSpanElement> | null>(null);
  contentTemplate = viewChild<ElementRef<HTMLDivElement>>('contentTemplate');

  // Hidden styles for focus guards
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

  // Computed properties for focus management
  modal = computed(() => this.focusManagerState()?.modal);
  open = computed(() => this.focusManagerState()?.open);

  shouldRenderGuards = computed(() => {
    const focusState = this.focusManagerState();
    const isAttached = this.isAttached();
    const root = this.root();

    return (
      // The FocusManager and therefore floating element are currently open/rendered.
      !!focusState &&
      // Guards are only for non-modal focus management.
      !focusState.modal &&
      // Don't render if unmount is transitioning.
      focusState.open &&
      this.preserveTabOrder() &&
      isAttached &&
      !!(root || this.portalNode())
    );
  });

  constructor() {
    // Portal lifecycle management
    effect((onCleanup) => {
      const id = this.id();
      const root = this.root();

      // Cleanup on input changes
      onCleanup(() => {
        this._detachPortal();
      });

      // Create portal
      this._createPortal(id, root);
    });

    // Focus management effect
    effect((onCleanup) => {
      const portalNode = this.portalNode();
      const preserveTabOrder = this.preserveTabOrder();
      const modal = this.modal();

      if (!portalNode || !preserveTabOrder || modal) {
        return;
      }

      const onFocus = (event: FocusEvent) => {
        if (portalNode && isOutsideEvent(event)) {
          const focusing = event.type === 'focusin';
          const manageFocus = focusing ? enableFocusInside : disableFocusInside;
          manageFocus(portalNode);
        }
      };

      portalNode.addEventListener('focusin', onFocus, true);
      portalNode.addEventListener('focusout', onFocus, true);

      onCleanup(() => {
        portalNode.removeEventListener('focusin', onFocus, true);
        portalNode.removeEventListener('focusout', onFocus, true);
      });
    });

    // Enable focus inside when closed
    effect(() => {
      const portalNode = this.portalNode();
      const open = this.open();

      if (!portalNode) return;
      if (open) return;

      enableFocusInside(portalNode);
    });

    // Move content to portal when portal is ready
    effect(() => {
      const portalNode = this.portalNode();
      const contentTemplate = this.contentTemplate();
      const isAttached = this.isAttached();

      if (!portalNode || !contentTemplate || !isAttached) {
        return;
      }

      // Move all content from the hidden template to the portal
      const contentElement = contentTemplate.nativeElement;
      while (contentElement.firstChild) {
        portalNode.appendChild(contentElement.firstChild);
      }
    });
  }

  ngOnDestroy(): void {
    this._detachPortal();
  }

  private _createPortal(
    id?: string,
    root?: HTMLElement | null | ElementRef<HTMLElement | null>,
  ): void {
    try {
      const attr = createAttribute('portal');
      const uniqueId = generateId();

      // Determine container
      const container = this._resolveContainer(id, root);
      if (!container) return;

      // Create portal node
      const portalElement = this.document.createElement('div');
      portalElement.id = uniqueId;
      portalElement.setAttribute(attr, '');

      // Create outlet
      const outlet = new FloatingPortalOutlet(container);

      // Create portal content
      const content: PortalContent = {
        element: portalElement,
        dispose: () => {
          // Additional cleanup if needed
        },
      };

      // Attach to outlet
      outlet.attach(content);

      // Update state
      this._portalOutlet.set(outlet);
      this._portalNode.set(portalElement);
      this._isAttached.set(true);
    } catch (error) {
      console.error('Failed to create portal:', error);
      this._isAttached.set(false);
    }
  }

  private _resolveContainer(
    id?: string,
    root?: HTMLElement | null | ElementRef<HTMLElement | null>,
  ): HTMLElement | null {
    // Handle existing ID
    if (id) {
      const existingElement = this.document.getElementById(id);
      if (existingElement) {
        return existingElement;
      }
    }

    // Handle root element
    let container = root;
    if (container && !isElement(container)) {
      container = (container as ElementRef<HTMLElement>).nativeElement;
    }

    // Create ID wrapper if needed
    const finalContainer = container || this.document.body;

    if (id && finalContainer) {
      const idWrapper = this.document.createElement('div');
      idWrapper.id = id;
      finalContainer.appendChild(idWrapper);
      return idWrapper;
    }

    return finalContainer as HTMLElement;
  }

  private _detachPortal(): void {
    const outlet = this._portalOutlet();

    if (outlet && outlet.hasAttached()) {
      outlet.dispose();
    }

    this._portalOutlet.set(null);
    this._portalNode.set(null);
    this._isAttached.set(false);
  }

  // Portal context provider
  getPortalContext() {
    return {
      preserveTabOrder: this.preserveTabOrder(),
      portalNode: this.portalNode(),
      isAttached: this.isAttached(),
      setFocusManagerState: (state: FocusManagerState) => {
        this.focusManagerState.set(state);
      },
      beforeInsideRef: this.beforeInsideRef(),
      afterInsideRef: this.afterInsideRef(),
      beforeOutsideRef: this.beforeOutsideRef() || null,
      afterOutsideRef: this.afterOutsideRef() || null,
    };
  }

  // Focus event handlers
  onBeforeOutsideFocus(event: FocusEvent): void {
    const portalNode = this.portalNode();
    const focusState = this.focusManagerState();

    if (!portalNode) return;

    if (isOutsideEvent(event, portalNode)) {
      this.beforeInsideRef()?.nativeElement.focus();
    } else {
      const domReference = focusState ? focusState.domReference : null;
      const prevTabbable = getPreviousTabbable(domReference);
      prevTabbable?.focus();
    }
  }

  onAfterOutsideFocus(event: FocusEvent): void {
    const portalNode = this.portalNode();
    const focusState = this.focusManagerState();

    if (!portalNode) return;

    if (isOutsideEvent(event, portalNode)) {
      this.afterInsideRef()?.nativeElement.focus();
    } else {
      const domReference = focusState ? focusState.domReference : null;
      const nextTabbable = getNextTabbable(domReference);
      nextTabbable?.focus();

      if (focusState?.closeOnFocusOut) {
        focusState.onOpenChange(false, event, 'focus-out');
      }
    }
  }
}
