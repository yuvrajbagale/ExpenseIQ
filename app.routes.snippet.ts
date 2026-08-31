// Add these routes to your existing app.routes.ts (or app-routing.module.ts).
// If you use NgModule-based routing instead of standalone, remove `standalone: true`
// from each component and declare them in a module instead.

import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  // ...your existing routes
];
