import {
  Component,
  computed,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import {FloatingPortalComponent} from '../../../../src/components/FloatingPortal';

@Component({
  selector: 'app-portal',
  template: `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
          FloatingPortal Test
        </h2>
        <p class="text-gray-600 mb-4">
          Enhanced portal implementation with CDK-inspired patterns for better
          lifecycle management and error handling.
        </p>

        <div class="space-y-4">
          <div class="flex gap-4">
            <button
              (click)="toggleBasicPortal()"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Toggle Basic Portal
            </button>

            <button
              (click)="toggleCustomRootPortal()"
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Toggle Custom Root Portal
            </button>

            <button
              (click)="toggleIdPortal()"
              class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Toggle ID Portal
            </button>
          </div>

          <div class="text-sm text-gray-500">
            <p><strong>Status:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li>
                Basic Portal: {{ showBasicPortal() ? 'Active' : 'Inactive' }}
              </li>
              <li>
                Custom Root Portal:
                {{ showCustomRootPortal() ? 'Active' : 'Inactive' }}
              </li>
              <li>ID Portal: {{ showIdPortal() ? 'Active' : 'Inactive' }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Portal containers -->
      @if (showBasicPortal()) {
        <fui-floating-portal>
          <div class="portal-content basic-portal">
            <h3 class="font-semibold mb-2">Basic Portal Content</h3>
            <p>
              This content is portaled to document.body using the enhanced
              FloatingPortal!
            </p>
            <button
              (click)="toggleBasicPortal()"
              class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </fui-floating-portal>
      }

      @if (showCustomRootPortal()) {
        <fui-floating-portal [root]="customPortalRootElement()">
          <div class="portal-content custom-portal">
            <h3 class="font-semibold mb-2">Custom Root Portal</h3>
            <p>This content is portaled to a custom container element!</p>
            <button
              (click)="toggleCustomRootPortal()"
              class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </fui-floating-portal>
      }

      @if (showIdPortal()) {
        <fui-floating-portal id="portal-test-container">
          <div class="portal-content id-portal">
            <h3 class="font-semibold mb-2">ID Portal Content</h3>
            <p>This content is portaled to an element with a specific ID!</p>
            <button
              (click)="toggleIdPortal()"
              class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </fui-floating-portal>
      }

      <!-- Custom root container -->
      <div class="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
        <h3 class="font-semibold mb-2 text-yellow-800">
          Custom Portal Container
        </h3>
        <p class="text-yellow-700 text-sm mb-2">
          Portal content with custom root will appear below:
        </p>
        <div
          #customPortalRoot
          class="min-h-[100px] bg-yellow-100 p-3 rounded border border-yellow-300"
        >
          <!-- Custom root portal content will appear here -->
        </div>
      </div>

      <!-- Portal examples and documentation -->
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">
          Portal Features
        </h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium mb-2 text-gray-700">✅ Enhanced Features</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• CDK-inspired lifecycle management</li>
              <li>• Proper error handling with typed errors</li>
              <li>• Better resource cleanup</li>
              <li>• State tracking with signals</li>
              <li>• Focus management preservation</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium mb-2 text-gray-700">🎯 Use Cases</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Tooltip positioning outside overflow containers</li>
              <li>• Modal dialogs in document.body</li>
              <li>• Popover content in custom containers</li>
              <li>• Dropdown menus with preserved focus</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .portal-content {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        max-width: 300px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
      }

      .basic-portal {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .custom-portal {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        position: static;
        transform: none;
        top: auto;
        left: auto;
      }

      .id-portal {
        border-color: #8b5cf6;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        position: static;
        transform: none;
        top: auto;
        left: auto;
      }
    `,
  ],
  imports: [FloatingPortalComponent],
})
export class PortalComponent {
  showBasicPortal = signal(false);
  showCustomRootPortal = signal(false);
  showIdPortal = signal(false);

  // Custom root element for portal
  customPortalRoot = viewChild<ElementRef<HTMLDivElement>>('customPortalRoot');
  customPortalRootElement = computed(
    () => this.customPortalRoot()?.nativeElement || null,
  );

  toggleBasicPortal(): void {
    this.showBasicPortal.update((show) => !show);
  }

  toggleCustomRootPortal(): void {
    this.showCustomRootPortal.update((show) => !show);
  }

  toggleIdPortal(): void {
    this.showIdPortal.update((show) => !show);
  }
}
