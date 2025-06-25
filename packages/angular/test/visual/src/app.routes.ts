import type {Routes} from '@angular/router';
import {ArrowComponent} from './components/arrow.component';
import {HomeComponent} from './components/home.component';
import {OverlayComponent} from './components/overlay.component';
import {PopoverComponent} from './components/popover.component';
import {PortalComponent} from './components/portal.component';
import {TooltipComponent} from './components/tooltip.component';
import {TreeComponent} from './components/tree.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'tooltip',
    component: TooltipComponent,
  },
  {
    path: 'popover',
    component: PopoverComponent,
  },
  {
    path: 'arrow',
    component: ArrowComponent,
  },
  {
    path: 'overlay',
    component: OverlayComponent,
  },
  {
    path: 'portal',
    component: PortalComponent,
  },
  {
    path: 'tree',
    component: TreeComponent,
  },
];
