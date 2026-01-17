import { Routes } from '@angular/router';
import { ReviewComponent } from './review/review.component';
import { AddPhraseComponent } from './add-phrase/add-phrase.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: ReviewComponent },
  { path: 'add', component: AddPhraseComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '' }
];
