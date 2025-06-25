import {
  Component,
  effect,
  inject,
  Injectable,
  InjectionToken,
  input,
  signal,
  type Signal,
} from '@angular/core';
import {createEventEmitter, type FloatingEvents} from '../utils/event-emitter';
import {generateId} from '../utils/id';

export interface FloatingNodeType {
  id: string | undefined;
  parentId: string | null;
}

export interface FloatingTreeType {
  nodesRef: Signal<Array<FloatingNodeType>>;
  events: FloatingEvents;
  addNode(node: FloatingNodeType): void;
  removeNode(node: FloatingNodeType): void;
}

/**
 * Service that manages the FloatingTree state
 */
@Injectable()
export class FloatingTreeService implements FloatingTreeType {
  private readonly _nodes = signal<Array<FloatingNodeType>>([]);
  private readonly _events = createEventEmitter();

  readonly nodesRef = this._nodes.asReadonly();
  readonly events = this._events;

  addNode(node: FloatingNodeType): void {
    this._nodes.update((nodes) => [...nodes, node]);
  }

  removeNode(node: FloatingNodeType): void {
    this._nodes.update((nodes) => nodes.filter((n) => n !== node));
  }
}

/**
 * Service to track the current floating node context hierarchy
 */
@Injectable()
export class FloatingNodeService {
  private _nodeId = signal<string | undefined>(undefined);
  private _parentNodeService = signal<FloatingNodeService | null>(null);

  readonly nodeId = this._nodeId.asReadonly();

  setNodeId(id: string | undefined): void {
    this._nodeId.set(id);
  }

  setParentService(parent: FloatingNodeService | null): void {
    this._parentNodeService.set(parent);
  }

  getParentId(): string | null {
    const parent = this._parentNodeService();
    return parent?.nodeId() || null;
  }
}

/**
 * Injection token for FloatingTree context
 */
export const FLOATING_TREE_TOKEN = new InjectionToken<FloatingTreeService | null>(
  'FLOATING_TREE_TOKEN',
  {
    providedIn: 'root',
    factory: () => null,
  },
);

/**
 * Injection token for FloatingNode context  
 */
export const FLOATING_NODE_TOKEN = new InjectionToken<FloatingNodeService | null>(
  'FLOATING_NODE_TOKEN',
  {
    providedIn: 'root', 
    factory: () => null,
  },
);

/**
 * Provides context for nested floating elements when they are not children of
 * each other on the DOM.
 * 
 * This is not necessary in all cases, except when there must be explicit communication between parent and child floating elements. It is necessary for:
 * - The `bubbles` option in the `injectDismiss()` function
 * - Nested virtual list navigation  
 * - Nested floating elements that each open on hover
 * - Custom communication between parent and child floating elements
 * 
 * @see https://floating-ui.com/docs/FloatingTree
 */
@Component({
  selector: 'fui-floating-tree',
  standalone: true,
  template: '<ng-content />',
  providers: [
    FloatingTreeService,
    {
      provide: FLOATING_TREE_TOKEN,
      useExisting: FloatingTreeService,
    },
  ],
})
export class FloatingTreeComponent {}

/**
 * Provides parent node context for nested floating elements.
 * @see https://floating-ui.com/docs/FloatingTree
 */
@Component({
  selector: 'fui-floating-node',
  standalone: true,
  template: '<ng-content />',
  providers: [
    FloatingNodeService,
    {
      provide: FLOATING_NODE_TOKEN,
      useExisting: FloatingNodeService,
    },
  ],
})
export class FloatingNodeComponent {
  /**
   * The ID of this floating node
   */
  id = input<string | undefined>();

  private readonly nodeService = inject(FloatingNodeService);
  private readonly parentNodeService = inject(FLOATING_NODE_TOKEN, { 
    optional: true, 
    skipSelf: true 
  });

  constructor() {
    // Set up parent relationship
    this.nodeService.setParentService(this.parentNodeService);
    
    // Update node ID when input changes
    effect(() => {
      const id = this.id();
      this.nodeService.setNodeId(id);
    });
  }
}

/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
export function injectFloatingParentNodeId(): string | null {
  const nodeService = inject(FLOATING_NODE_TOKEN, { optional: true, skipSelf: true });
  return nodeService?.nodeId() || null;
}

/**
 * Returns the nearest floating tree context, if available.
 */
export function injectFloatingTree(): FloatingTreeService | null {
  return inject(FLOATING_TREE_TOKEN, { optional: true });
}

/**
 * Hook-like function for registering a floating element in the tree.
 * Call this in a component constructor or inside an effect.
 * Returns a cleanup function that should be called on component destruction.
 * 
 * @see https://floating-ui.com/docs/FloatingTree
 */
export function useFloatingNodeId(customParentId?: string): {
  nodeId: string | undefined;
  cleanup: () => void;
} {
  const tree = injectFloatingTree();
  const reactParentId = injectFloatingParentNodeId();
  const parentId = customParentId || reactParentId;
  
  const nodeId = generateId();
  let cleanup = () => {};

  // Register node in tree if available
  if (tree && nodeId) {
    const node: FloatingNodeType = { id: nodeId, parentId };
    tree.addNode(node);
    
    cleanup = () => {
      tree.removeNode(node);
    };
  }

  return { nodeId, cleanup };
}

/**
 * Angular injection function for floating node registration with automatic lifecycle management.
 * This function creates an effect that manages the node registration and cleanup automatically.
 * 
 * @param customParentId Optional custom parent ID
 * @returns Signal containing the node ID
 */
export function injectFloatingNodeId(customParentId?: string): Signal<string | undefined> {
  const tree = injectFloatingTree();
  const reactParentId = injectFloatingParentNodeId();
  const parentId = customParentId || reactParentId;
  
  const nodeId = generateId();
  const nodeIdSignal = signal<string | undefined>(nodeId);

  // Use effect for automatic lifecycle management
  effect((onCleanup) => {
    if (!tree || !nodeId) return;

    const node: FloatingNodeType = { id: nodeId, parentId };
    tree.addNode(node);
    
    onCleanup(() => {
      tree.removeNode(node);
    });
  });

  return nodeIdSignal.asReadonly();
}