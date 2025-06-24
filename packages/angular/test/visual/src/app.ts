import {NgClass} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';

interface Route {
  path: string;
  label: string;
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, NgClass],
  template: `
    <div class="min-h-screen max-h-screen bg-gray-50 overflow-y-auto">
      <!-- Sidebar Navigation -->
      <nav
        class="fixed top-0 left-0 flex-col hidden h-full p-8 overflow-y-auto bg-slate-100 lg:w-64 lg:flex"
      >
        <div class="mb-8">
          <a routerLink="/" class="block mb-4 text-2xl font-bold text-gray-800">
            Angular Tests
          </a>
          <p class="text-sm text-gray-600">Floating UI for Angular</p>
        </div>

        <ul class="flex flex-col text-lg space-y-2">
          @for (route of routes; track route.path) {
            <li>
              <a
                [routerLink]="route.path === '' ? '/' : '/' + route.path"
                class="block py-2 px-3 rounded transition-colors hover:bg-slate-200"
                [ngClass]="{
                  'bg-slate-200 font-semibold': isActiveRoute(route.path),
                  'text-gray-700': !isActiveRoute(route.path)
                }"
              >
                {{ route.label }}
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- Main Content -->
      <main class="p-12 lg:ml-64 flex">
        <div class="flex-1 overflow-y-auto">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class App {
  private readonly router = inject(Router);

  protected readonly routes: Route[] = [
    {path: '', label: 'Home'},
    {path: 'tooltip', label: 'Tooltip'},
    {path: 'popover', label: 'Popover'},
    {path: 'arrow', label: 'Arrow'},
    {path: 'overlay', label: 'Overlay'},
  ];

  protected isActiveRoute(path: string): boolean {
    const currentUrl = this.router.url;
    if (path === '') {
      return currentUrl === '/';
    }
    return currentUrl === `/${path}`;
  }
}
