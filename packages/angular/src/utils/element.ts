import {isShadowRoot} from '@floating-ui/utils/dom';

export function activeElement(doc: Document): Element | null {
  let activeElement = doc.activeElement;

  while (activeElement?.shadowRoot?.activeElement != null) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
}

export function contains(
  parent?: Element | null,
  child?: Element | null,
): boolean {
  if (!parent || !child) {
    return false;
  }

  const rootNode = child.getRootNode?.();

  // First, attempt with faster native method
  if (parent.contains(child)) {
    return true;
  }

  // then fallback to custom implementation with Shadow DOM support
  if (rootNode && isShadowRoot(rootNode)) {
    let next = child;
    while (next) {
      if (parent === next) {
        return true;
      }
      // @ts-ignore
      next = next.parentNode || next.host;
    }
  }

  // Give up, the result is false
  return false;
}

export function getDocument(node: Element | null): Document {
  return node?.ownerDocument || document;
}

export function isEventTargetWithin(
  event: Event,
  node: Node | null | undefined,
): boolean {
  if (node == null) {
    return false;
  }

  if ('composedPath' in event) {
    return event.composedPath().includes(node);
  }

  // TS thinks `event` is of type never as it assumes all browsers support composedPath, but browsers without shadow dom don't
  const e = event as Event;
  return e.target != null && node.contains(e.target as Node);
}