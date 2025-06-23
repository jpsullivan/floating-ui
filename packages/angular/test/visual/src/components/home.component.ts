import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl">
      <h1 class="text-5xl font-bold mb-6 text-gray-800">
        Floating UI Angular Testing Grounds
      </h1>

      <div class="prose prose-lg">
        <p class="text-xl text-gray-600 mb-8">
          Welcome to the Angular implementation of Floating UI! Use the
          navigation on the left to browse through different interactive
          examples and test components.
        </p>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 class="text-2xl font-semibold mb-4 text-blue-800">
            Available Examples
          </h2>
          <ul class="space-y-2">
            <li class="flex items-center">
              <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <strong>Tooltip:</strong> Basic tooltip implementation with hover
              interactions
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <strong>Popover:</strong> Click-triggered popover with focus
              management
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <strong>Arrow:</strong> Floating elements with pointing arrows
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <strong>Overlay:</strong> Modal dialogs with backdrop and scroll
              locking
            </li>
          </ul>
        </div>

        <div class="bg-gray-100 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3">Built with Angular Signals</h3>
          <p class="text-gray-700">
            This implementation leverages Angular's new signals API for reactive
            state management, providing a modern and efficient way to handle
            floating UI positioning and interactions.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {}
