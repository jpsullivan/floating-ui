import type {Routes} from '@angular/router';
import {ArrowComponent} from './components/arrow.component';
import {HomeComponent} from './components/home.component';
import {PopoverComponent} from './components/popover.component';
import {TooltipComponent} from './components/tooltip.component';

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
];
