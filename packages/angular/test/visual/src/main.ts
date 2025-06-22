import {bootstrapApplication} from '@angular/platform-browser';
import 'zone.js';
import {App} from './app';
import {appConfig} from './app.config';

console.log('Starting Angular Floating UI visual tests...');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
