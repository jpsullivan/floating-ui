/**
 * Error handling utilities for portal operations.
 * Inspired by Angular CDK Portal implementation.
 */

export class PortalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalError';
  }
}

export function throwNullPortalOutletError(): never {
  throw new PortalError('Attempting to attach a portal to a null PortalOutlet');
}

export function throwPortalAlreadyAttachedError(): never {
  throw new PortalError('Portal is already attached to a host');
}

export function throwNoPortalAttachedError(): never {
  throw new PortalError('Attempting to detach a portal that is not attached to a host');
}

export function throwPortalOutletAlreadyDisposedError(): never {
  throw new PortalError('PortalOutlet has already been disposed');
}

export function throwNullPortalError(): never {
  throw new PortalError('Portal must be provided');
}