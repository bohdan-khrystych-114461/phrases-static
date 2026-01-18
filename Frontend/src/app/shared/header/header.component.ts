import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <a [routerLink]="leftLink" class="header-btn">{{ leftText }}</a>
      
      <ng-content></ng-content>
      
      @if (!hideTitle) {
        <h1>{{ title }}</h1>
      }
      
      @if (showAdd) {
        <a routerLink="/add" class="header-btn">+ Add</a>
      } @else {
        <div class="spacer"></div>
      }
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    h1 {
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      flex: 1;
      text-align: center;
    }

    .header-btn {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      transition: background 0.2s;
    }

    .header-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    .spacer {
      width: 70px;
    }
  `]
})
export class HeaderComponent {
  @Input() leftLink = '/';
  @Input() leftText = '←';
  @Input() title = '';
  @Input() showAdd = true;
  @Input() hideTitle = false;
}
