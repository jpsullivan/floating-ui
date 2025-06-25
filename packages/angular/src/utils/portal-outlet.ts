/**
 * Enhanced portal outlet implementation inspired by Angular CDK.
 * Provides better lifecycle management and error handling.
 */

import {signal, type Signal} from '@angular/core';
import {
  throwNullPortalError,
  throwPortalAlreadyAttachedError,
  throwPortalOutletAlreadyDisposedError,
} from './portal-errors';

export interface PortalContent {
  element: HTMLElement;
  dispose?(): void;
}

export interface PortalOutlet {
  attach(content: PortalContent): void;
  detach(): void;
  dispose(): void;
  hasAttached(): boolean;
  isDisposed: Signal<boolean>;
}

export class FloatingPortalOutlet implements PortalOutlet {
  private _attachedContent: PortalContent | null = null;
  private _disposeFn: (() => void) | null = null;
  private readonly _isDisposed = signal(false);
  
  readonly isDisposed = this._isDisposed.asReadonly();

  constructor(private readonly _hostElement: HTMLElement) {}

  hasAttached(): boolean {
    return !!this._attachedContent;
  }

  attach(content: PortalContent): void {
    if (!content) {
      throwNullPortalError();
    }

    if (this.hasAttached()) {
      throwPortalAlreadyAttachedError();
    }

    if (this._isDisposed()) {
      throwPortalOutletAlreadyDisposedError();
    }

    this._attachedContent = content;
    this._hostElement.appendChild(content.element);
  }

  detach(): void {
    const content = this._attachedContent;
    
    if (content) {
      this._attachedContent = null;
      
      // Remove from DOM
      if (content.element.parentNode) {
        content.element.parentNode.removeChild(content.element);
      }
      
      // Call disposal function if provided
      content.dispose?.();
    }

    this._invokeDisposeFn();
  }

  dispose(): void {
    if (this.hasAttached()) {
      this.detach();
    }

    this._invokeDisposeFn();
    this._isDisposed.set(true);
  }

  setDisposeFn(fn: () => void): void {
    this._disposeFn = fn;
  }

  private _invokeDisposeFn(): void {
    if (this._disposeFn) {
      this._disposeFn();
      this._disposeFn = null;
    }
  }
}