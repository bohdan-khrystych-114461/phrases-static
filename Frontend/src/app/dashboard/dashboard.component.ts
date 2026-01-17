import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PhraseService } from '../services/phrase.service';
import { Phrase } from '../models/phrase.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <header class="header">
        <a routerLink="/" class="back-btn">← Review</a>
        <h1>All Phrases</h1>
        <a routerLink="/add" class="add-btn">+ Add</a>
      </header>

      <div class="filters">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="onSearch()"
            placeholder="Search phrases..."
          >
        </div>
        <div class="status-filter">
          <select [(ngModel)]="statusFilter" (change)="onSearch()">
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Learning">Learning</option>
            <option value="Known">Known</option>
          </select>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat new">
          <span class="stat-value">{{ newCount }}</span>
          <span class="stat-label">New</span>
        </div>
        <div class="stat learning">
          <span class="stat-value">{{ learningCount }}</span>
          <span class="stat-label">Learning</span>
        </div>
        <div class="stat mastered">
          <span class="stat-value">{{ masteredCount }}</span>
          <span class="stat-label">Mastered</span>
        </div>
      </div>

      <main class="main">
        @if (loading) {
          <div class="loading">Loading...</div>
        } @else if (phrases.length === 0) {
          <div class="empty">
            <p>No phrases found</p>
            @if (searchTerm || statusFilter) {
              <button class="clear-btn" (click)="clearFilters()">Clear filters</button>
            }
          </div>
        } @else {
          <div class="phrase-list">
            @for (phrase of phrases; track phrase.id) {
              <div class="swipe-container">
                <div 
                  class="delete-action" 
                  (click)="confirmSwipeDelete(phrase)"
                  (touchend)="$event.stopPropagation(); confirmSwipeDelete(phrase)"
                >
                  <span>🗑️ Delete</span>
                </div>
                <div 
                  class="phrase-card" 
                  [class.swiped]="swipedId === phrase.id"
                  (click)="onCardClick(phrase, $event)"
                  (touchstart)="onTouchStart($event)"
                  (touchmove)="onTouchMove($event, phrase)"
                  (touchend)="onTouchEnd(phrase)"
                >
                  <div class="phrase-header">
                    <span class="phrase-text">{{ phrase.text }}</span>
                    <span class="status-badge" [class]="phrase.status.toLowerCase()">
                      {{ phrase.status }}
                    </span>
                  </div>
                  @if (phrase.meaning) {
                    <p class="phrase-meaning">{{ phrase.meaning }}</p>
                  }
                  <div class="phrase-meta">
                    <span class="date">Added: {{ phrase.createdAt | date:'shortDate' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>

      @if (editingPhrase) {
        <div class="modal-overlay" (click)="closeEdit()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Edit Phrase</h2>
              <button class="close-btn" (click)="closeEdit()">✕</button>
            </div>
            <form (ngSubmit)="saveEdit()">
              <div class="field">
                <label>Phrase</label>
                <input type="text" [(ngModel)]="editForm.text" name="text" required>
              </div>
              <div class="field">
                <label>Meaning</label>
                <textarea [(ngModel)]="editForm.meaning" name="meaning" rows="2"></textarea>
              </div>
              <div class="field">
                <label>Example</label>
                <textarea [(ngModel)]="editForm.example" name="example" rows="2"></textarea>
              </div>
              <div class="field">
                <label>Personal Note</label>
                <textarea [(ngModel)]="editForm.personalNote" name="personalNote" rows="2"></textarea>
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="editForm.status" name="status">
                  <option value="New">New</option>
                  <option value="Learning">Learning</option>
                  <option value="Mastered">Mastered</option>
                </select>
              </div>
              <div class="modal-actions">
                <button type="button" class="delete-btn" (click)="deletePhrase()" [disabled]="saving">
                  🗑️ Delete
                </button>
                <button type="button" class="cancel-btn" (click)="closeEdit()">Cancel</button>
                <button type="submit" class="save-btn" [disabled]="saving">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header h1 {
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .back-btn, .add-btn {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      transition: background 0.2s;
    }

    .back-btn:hover, .add-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .search-box {
      flex: 1;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 1rem;
      background: white;
    }

    .status-filter select {
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 1rem;
      background: white;
      cursor: pointer;
    }

    .stats {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .stat {
      flex: 1;
      background: rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 12px 8px;
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .stat-label {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.8);
      text-transform: uppercase;
    }

    .stat.new { background: rgba(25, 118, 210, 0.3); }
    .stat.learning { background: rgba(245, 124, 0, 0.3); }
    .stat.mastered { background: rgba(56, 142, 60, 0.3); }

    .loading, .empty {
      text-align: center;
      color: white;
      padding: 40px;
    }

    .clear-btn {
      margin-top: 16px;
      padding: 10px 20px;
      background: rgba(255,255,255,0.2);
      color: white;
      border-radius: 8px;
      font-weight: 500;
    }

    .phrase-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .phrase-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .phrase-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .phrase-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a2e;
      flex: 1;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .status-badge.new {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-badge.learning {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-badge.mastered {
      background: #e8f5e9;
      color: #388e3c;
    }

    .phrase-meaning {
      color: #555;
      font-size: 0.95rem;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .phrase-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #888;
    }

    .confidence {
      font-weight: 500;
    }

    .swipe-container {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
    }

    .delete-action {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100px;
      background: #c62828;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      border-radius: 0 16px 16px 0;
    }

    .phrase-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      z-index: 1;
    }

    .phrase-card.swiped {
      transform: translateX(-100px);
    }

    .phrase-card:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }

    @media (hover: hover) {
      .phrase-card:hover:not(.swiped) {
        transform: translateY(-2px);
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 20px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .close-btn {
      background: none;
      font-size: 1.5rem;
      color: #888;
      padding: 4px;
    }

    .field {
      margin-bottom: 16px;
    }

    .field label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    .field input,
    .field textarea,
    .field select {
      width: 100%;
      padding: 10px 12px;
      font-size: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: border-color 0.2s;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      border-color: #667eea;
      outline: none;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .cancel-btn, .save-btn {
      flex: 1;
      padding: 12px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 8px;
    }

    .cancel-btn {
      background: #f5f5f5;
      color: #666;
    }

    .save-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .save-btn:disabled {
      opacity: 0.6;
    }

    .delete-btn {
      background: #ffebee;
      color: #c62828;
    }

    .delete-btn:hover {
      background: #ffcdd2;
    }

    .modal-actions {
      display: flex;
      gap: 8px;
    }

    .delete-btn {
      flex: 0;
      padding: 12px 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  phrases: Phrase[] = [];
  allPhrases: Phrase[] = [];
  searchTerm = '';
  statusFilter = '';
  loading = true;
  
  editingPhrase: Phrase | null = null;
  editForm = { text: '', meaning: '', example: '', personalNote: '', status: '' };
  saving = false;

  // Swipe state
  swipedId: string | null = null;
  private touchStartX = 0;
  private touchCurrentX = 0;
  private isSwiping = false;

  constructor(private phraseService: PhraseService) {}

  ngOnInit(): void {
    this.loadPhrases();
  }

  get totalCount(): number {
    return this.allPhrases.length;
  }

  get newCount(): number {
    return this.allPhrases.filter(p => p.status === 'New').length;
  }

  get learningCount(): number {
    return this.allPhrases.filter(p => p.status === 'Learning').length;
  }

  get masteredCount(): number {
    return this.allPhrases.filter(p => p.status === 'Mastered').length;
  }

  loadPhrases(): void {
    this.loading = true;
    this.phraseService.getAllPhrases().subscribe({
      next: (phrases) => {
        this.allPhrases = phrases;
        this.phrases = phrases;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.phraseService.getAllPhrases(this.searchTerm, this.statusFilter).subscribe({
      next: (phrases) => {
        this.phrases = phrases;
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.phrases = this.allPhrases;
  }

  openEdit(phrase: Phrase): void {
    this.editingPhrase = phrase;
    this.editForm = {
      text: phrase.text,
      meaning: phrase.meaning || '',
      example: phrase.example || '',
      personalNote: phrase.personalNote || '',
      status: phrase.status
    };
  }

  closeEdit(): void {
    this.editingPhrase = null;
  }

  saveEdit(): void {
    if (!this.editingPhrase || this.saving) return;
    
    const id = this.editingPhrase.id;
    
    // Optimistic update - update UI immediately
    const optimisticPhrase: Phrase = {
      ...this.editingPhrase,
      text: this.editForm.text,
      meaning: this.editForm.meaning || null,
      example: this.editForm.example || null,
      personalNote: this.editForm.personalNote || null,
      status: this.editForm.status as 'New' | 'Learning' | 'Mastered'
    };
    
    const idx = this.phrases.findIndex(p => p.id === id);
    if (idx >= 0) this.phrases[idx] = optimisticPhrase;
    const allIdx = this.allPhrases.findIndex(p => p.id === id);
    if (allIdx >= 0) this.allPhrases[allIdx] = optimisticPhrase;
    
    this.closeEdit();
    
    // Sync with database in background
    this.phraseService.updatePhrase(id, this.editForm).subscribe({
      next: (updated) => {
        // Update with server response (in case of any differences)
        const i = this.phrases.findIndex(p => p.id === updated.id);
        if (i >= 0) this.phrases[i] = updated;
        const ai = this.allPhrases.findIndex(p => p.id === updated.id);
        if (ai >= 0) this.allPhrases[ai] = updated;
      },
      error: () => {
        // Revert on error - reload from server
        this.loadPhrases();
      }
    });
  }

  deletePhrase(): void {
    if (!this.editingPhrase || this.saving) return;
    if (!confirm('Are you sure you want to delete this phrase?')) return;

    this.saving = true;
    const id = this.editingPhrase.id;
    this.phraseService.deletePhrase(id).subscribe({
      next: () => {
        this.phrases = this.phrases.filter(p => p.id !== id);
        this.allPhrases = this.allPhrases.filter(p => p.id !== id);
        this.saving = false;
        this.closeEdit();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  // Swipe handlers
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchCurrentX = this.touchStartX;
    this.isSwiping = false;
  }

  onTouchMove(event: TouchEvent, phrase: Phrase): void {
    this.touchCurrentX = event.touches[0].clientX;
    const diff = this.touchStartX - this.touchCurrentX;
    
    if (diff > 30) {
      this.isSwiping = true;
      this.swipedId = phrase.id;
    } else if (diff < -30 && this.swipedId === phrase.id) {
      this.swipedId = null;
    }
  }

  onTouchEnd(phrase: Phrase): void {
    if (this.swipedId === phrase.id && this.isSwiping) {
      // Card stays swiped, user can tap delete
    }
    this.isSwiping = false;
  }

  onCardClick(phrase: Phrase, event: Event): void {
    if (this.swipedId === phrase.id) {
      // If swiped, tap on delete area deletes, tap on card closes swipe
      const target = event.target as HTMLElement;
      if (target.closest('.delete-action')) {
        this.confirmSwipeDelete(phrase);
      } else {
        this.swipedId = null;
      }
    } else {
      this.openEdit(phrase);
    }
  }

  confirmSwipeDelete(phrase: Phrase): void {
    if (!confirm('Delete this phrase?')) {
      this.swipedId = null;
      return;
    }
    
    this.phraseService.deletePhrase(phrase.id).subscribe({
      next: () => {
        this.phrases = this.phrases.filter(p => p.id !== phrase.id);
        this.allPhrases = this.allPhrases.filter(p => p.id !== phrase.id);
        this.swipedId = null;
      }
    });
  }
}
