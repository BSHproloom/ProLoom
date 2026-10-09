import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

import 'firebase/firestore';
import 'firebase/storage';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));

console.log("Automated deployment via GitHub Actions successful!");
