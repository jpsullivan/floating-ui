import {signal, type Signal} from '@angular/core';

export interface FloatingNodeContext {
  id: string;
  parentId?: string;
  open: Signal<boolean>;
  escapeKeyBubbles?: boolean;
}

export interface FloatingTreeContext {
  nodesRef: Signal<Map<string, FloatingNodeContext>>;
  addNode: (node: FloatingNodeContext) => void;
  removeNode: (id: string) => void;
  getNode: (id: string) => FloatingNodeContext | undefined;
  getChildren: (parentId: string) => FloatingNodeContext[];
}

/**
 * Global tree instance for managing hierarchical floating elements
 */
export class FloatingTreeManager implements FloatingTreeContext {
  private readonly nodes = signal(new Map<string, FloatingNodeContext>());

  readonly nodesRef = this.nodes.asReadonly();

  addNode(node: FloatingNodeContext): void {
    this.nodes.update((nodes) => {
      const newNodes = new Map(nodes);
      newNodes.set(node.id, node);
      return newNodes;
    });
  }

  removeNode(id: string): void {
    this.nodes.update((nodes) => {
      const newNodes = new Map(nodes);
      newNodes.delete(id);
      return newNodes;
    });
  }

  getNode(id: string): FloatingNodeContext | undefined {
    return this.nodes().get(id);
  }

  getChildren(parentId: string): FloatingNodeContext[] {
    return Array.from(this.nodes().values()).filter(
      (node) => node.parentId === parentId,
    );
  }
}

/**
 * Global floating tree instance (similar to React's context)
 */
export const FloatingTreeService = new FloatingTreeManager();

/**
 * Creates a unique node ID
 */
export function generateNodeId(): string {
  return `floating-node-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Hook for registering a floating element in the tree
 */
export function injectFloatingNode(
  open: Signal<boolean>,
  parentId?: string,
  escapeKeyBubbles: boolean = true,
): {
  nodeId: string;
  tree: FloatingTreeManager;
  cleanup: () => void;
} {
  const tree = FloatingTreeService;
  const nodeId = generateNodeId();

  const node: FloatingNodeContext = {
    id: nodeId,
    parentId,
    open,
    escapeKeyBubbles,
  };

  // Register node
  tree.addNode(node);

  return {
    nodeId,
    tree,
    cleanup: () => {
      tree.removeNode(nodeId);
    },
  };
}

/**
 * Helper function to determine if an escape key event should bubble
 * (matches React's useDismiss bubbling logic)
 */
export function shouldEscapeKeyBubble(
  tree: FloatingTreeManager,
  nodeId: string,
  escapeKeyBubbles: boolean,
): boolean {
  if (escapeKeyBubbles) {
    return true;
  }

  // Check if any children are open and don't allow bubbling
  const children = tree.getChildren(nodeId);
  for (const child of children) {
    if (child.open() && !child.escapeKeyBubbles) {
      return false; // Don't dismiss if child is open and doesn't allow bubbling
    }
  }

  return true;
}
