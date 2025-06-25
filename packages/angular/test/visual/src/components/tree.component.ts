import {
  Component,
  computed,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import {
  FloatingTreeComponent,
  FloatingNodeComponent,
  injectFloatingNodeId,
  injectFloatingTree,
  injectFloatingParentNodeId,
} from '../../../../src/components/FloatingTree';

@Component({
  selector: 'nested-popover',
  standalone: true,
  imports: [FloatingNodeComponent],
  template: `
    <fui-floating-node [id]="nodeId()">
      <div class="nested-popover">
        <h4 class="font-semibold mb-2">{{ title }}</h4>
        <p class="text-sm text-gray-600 mb-2">Node ID: {{ nodeId() }}</p>
        <p class="text-sm text-gray-600 mb-2">Parent ID: {{ parentId() || 'null' }}</p>
        <button
          (click)="toggleOpen()"
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          {{ isOpen() ? 'Close' : 'Open' }}
        </button>
        
        @if (isOpen()) {
          <div class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
            <nested-popover [title]="'Nested ' + title" />
          </div>
        }
      </div>
    </fui-floating-node>
  `,
  styles: [`
    .nested-popover {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      margin: 0.5rem 0;
    }
  `],
})
export class NestedPopoverComponent {
  title = signal('Popover');
  isOpen = signal(false);
  
  // Register this component in the FloatingTree
  nodeId = injectFloatingNodeId();
  // Inject parent ID in constructor, not in computed  
  private readonly _parentId = injectFloatingParentNodeId();
  private readonly _parentIdSignal = signal(this._parentId);
  parentId = this._parentIdSignal.asReadonly();
  tree = injectFloatingTree();

  toggleOpen(): void {
    this.isOpen.update(open => !open);
  }
}

@Component({
  selector: 'app-tree',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
          FloatingTree Test
        </h2>
        <p class="text-gray-600 mb-4">
          Demonstrates nested floating elements with tree communication and context management.
        </p>

        <div class="space-y-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Tree Information</h3>
            <p class="text-sm text-gray-600 mb-2">
              Total nodes in tree: {{ totalNodes() }}
            </p>
            <p class="text-sm text-gray-600">
              Root nodes: {{ rootNodes() }}
            </p>
          </div>

          <fui-floating-tree>
            <nested-popover [title]="'Root Popover'" />
          </fui-floating-tree>
        </div>
      </div>

      <!-- Documentation -->
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">FloatingTree Features</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium mb-2 text-gray-700">✅ Core Features</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Hierarchical floating element management</li>
              <li>• Parent-child node relationships</li>
              <li>• Event communication system</li>
              <li>• Automatic node registration/cleanup</li>
              <li>• Angular dependency injection support</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium mb-2 text-gray-700">🎯 Use Cases</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Nested popover/tooltip management</li>
              <li>• Dismiss behavior coordination</li>
              <li>• Focus management across layers</li>
              <li>• Custom parent-child communication</li>
              <li>• Virtual list navigation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [FloatingTreeComponent, NestedPopoverComponent],
})
export class TreeComponent {
  tree = injectFloatingTree();
  
  totalNodes = computed(() => {
    const tree = this.tree;
    return tree ? tree.nodesRef().length : 0;
  });

  rootNodes = computed(() => {
    const tree = this.tree;
    if (!tree) return 0;
    return tree.nodesRef().filter(node => node.parentId === null).length;
  });
}