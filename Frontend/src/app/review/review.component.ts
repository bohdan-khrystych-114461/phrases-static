import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PhraseService } from '../services/phrase.service';
import { Phrase } from '../models/phrase.model';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  template: `
    <div class="container">
      <app-header leftLink="/dashboard" leftText="☰" [hideTitle]="true" [showAdd]="true">
      </app-header>

      <main class="main">
        @if (loading) {
          <div class="loading">Loading...</div>
        } @else if (currentPhrase) {
          <div 
            class="card" 
            [class.swiping-left]="swipeDirection === 'left'"
            [class.swiping-right]="swipeDirection === 'right'"
            [style.transform]="'translateX(' + swipeOffset + 'px) rotate(' + (swipeOffset / 20) + 'deg)'"
            (click)="onCardClick($event)"
            (touchstart)="onTouchStart($event)"
            (touchmove)="onTouchMove($event)"
            (touchend)="onTouchEnd()"
          >
            <div class="phrase-text">{{ currentPhrase.text }}</div>
            
            @if (revealed) {
              <div class="meaning-section">
                @if (currentPhrase.meaning) {
                  <div class="meaning">
                    <p>{{ currentPhrase.meaning }}</p>
                  </div>
                }
                @if (currentPhrase.example) {
                  <div class="example">
                    <span class="label">Example</span>
                    <p>{{ currentPhrase.example }}</p>
                  </div>
                }
                @if (currentPhrase.personalNote) {
                  <div class="note">
                    <span class="label">Note</span>
                    <p>{{ currentPhrase.personalNote }}</p>
                  </div>
                }
              </div>
            } @else {
              <div class="tap-hint">tap to flip</div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <h2>All done!</h2>
            <p>No phrases to review right now.</p>
            <a routerLink="/add" class="add-phrase-link">Add a new phrase</a>
          </div>
        }
      </main>

      @if (currentPhrase) {
        <div class="bottom-bar">
          @if (revealed) {
            <button class="action-btn edit" (click)="openEdit()">
              ✏️
            </button>
          }
          <button class="action-btn forgot" (click)="submitReview('dontKnow')" [disabled]="submitting">
            Forgot
          </button>
          <button class="action-btn got-it" (click)="submitReview('know')" [disabled]="submitting">
            Got it
          </button>
        </div>
      }

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
                <div class="input-with-btn">
                  <input type="text" [(ngModel)]="editForm.text" name="text" required>
                  <button 
                    type="button" 
                    class="autofill-btn" 
                    (click)="autofill()"
                    [disabled]="!editForm.text.trim() || autofilling"
                    title="Auto-fill with AI"
                  >
                    {{ autofilling ? '...' : '✨' }}
                  </button>
                </div>
              </div>
              <div class="field">
                <label>Meaning</label>
                <textarea [(ngModel)]="editForm.meaning" name="meaning" rows="3" class="auto-expand"></textarea>
              </div>
              <div class="field">
                <label>Example</label>
                <textarea [(ngModel)]="editForm.example" name="example" rows="3" class="auto-expand"></textarea>
              </div>
              <div class="field field-row">
                <div class="field-half">
                  <label>Personal Note</label>
                  <textarea [(ngModel)]="editForm.personalNote" name="personalNote" rows="2" class="auto-expand"></textarea>
                </div>
                <div class="field-quarter">
                  <label>Status</label>
                  <select [(ngModel)]="editForm.status" name="status">
                    <option value="New">New</option>
                    <option value="Learning">Learning</option>
                    <option value="Mastered">Mastered</option>
                  </select>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="delete-link" (click)="deletePhrase()">Delete</button>
                <div class="action-buttons">
                  <button type="button" class="cancel-btn" (click)="closeEdit()">Cancel</button>
                  <button type="submit" class="save-btn" [disabled]="saving">
                    {{ saving ? 'Saving...' : 'Save' }}
                  </button>
                </div>
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
      padding-bottom: 100px;
      max-width: 480px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    .main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    .loading {
      color: white;
      font-size: 1.2rem;
    }

    .card {
      background: white;
      border-radius: 20px;
      padding: 32px 24px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      cursor: pointer;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: box-shadow 0.2s, transform 0.15s ease-out;
      touch-action: pan-y;
    }

    .card:active {
      transform: scale(0.98);
    }

    .card.swiping-left {
      box-shadow: -10px 10px 40px rgba(198, 40, 40, 0.4);
    }

    .card.swiping-right {
      box-shadow: 10px 10px 40px rgba(46, 125, 50, 0.4);
    }

    .phrase-text {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.3;
    }

    .tap-hint {
      margin-top: 24px;
      color: #999;
      font-size: 0.9rem;
      animation: fadeIn 0.3s ease-out;
    }

    .meaning-section {
      text-align: left;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .meaning, .example, .note {
      margin-bottom: 16px;
    }

    .meaning p {
      font-size: 1.1rem;
      color: #333;
      line-height: 1.5;
    }

    .label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .example p, .note p {
      color: #555;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      padding-bottom: 32px;
      display: flex;
      gap: 12px;
      max-width: 480px;
      margin: 0 auto;
      background: linear-gradient(to top, rgba(102, 126, 234, 1) 60%, rgba(102, 126, 234, 0) 100%);
    }

    .action-btn {
      flex: 1;
      padding: 18px 24px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 16px;
      transition: transform 0.15s ease-out, opacity 0.15s;
    }

    .action-btn:active {
      transform: scale(0.95);
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-btn.edit {
      background: white;
      color: #666;
      flex: 0 0 auto;
      padding: 18px 20px;
      font-size: 1.2rem;
    }

    .action-btn.forgot {
      background: white;
      color: #c62828;
    }

    .action-btn.got-it {
      background: white;
      color: #2e7d32;
    }

    .action-btn:not(:disabled):active {
      transform: scale(0.95);
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
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      font-size: 1.2rem;
      color: #666;
      padding: 4px 8px;
    }

    .modal form {
      padding: 20px;
    }

    .field {
      margin-bottom: 20px;
    }

    .field-row {
      display: flex;
      gap: 16px;
    }

    .field-half {
      flex: 2;
    }

    .field-quarter {
      flex: 1;
    }

    .field label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .field input,
    .field textarea,
    .field select {
      width: 100%;
      padding: 12px 14px;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      background: #f7f8fa;
      transition: background 0.2s, box-shadow 0.2s;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      background: #fff;
      box-shadow: 0 0 0 2px #667eea;
      outline: none;
    }

    .field textarea.auto-expand {
      min-height: 60px;
      resize: vertical;
    }

    .input-with-btn {
      display: flex;
      gap: 8px;
    }

    .input-with-btn input {
      flex: 1;
    }

    .autofill-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .autofill-btn:disabled {
      opacity: 0.5;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .delete-link {
      background: none;
      color: #c62828;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 8px 0;
    }

    .delete-link:hover {
      text-decoration: underline;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
    }

    .cancel-btn {
      padding: 12px 20px;
      background: #f5f5f5;
      color: #666;
      border-radius: 10px;
      font-weight: 500;
    }

    .save-btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 10px;
      font-weight: 600;
    }

    .save-btn:disabled {
      opacity: 0.6;
    }

    .empty-state {
      text-align: center;
      color: white;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .empty-state h2 {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .empty-state p {
      opacity: 0.8;
      margin-bottom: 24px;
    }

    .add-phrase-link {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s;
    }

    .add-phrase-link:hover {
      transform: translateY(-2px);
    }
  `]
})
export class ReviewComponent implements OnInit {
  phrases: Phrase[] = [];
  currentIndex = 0;
  revealed = false;
  loading = true;
  submitting = false;
  
  editingPhrase: Phrase | null = null;
  editForm = { text: '', meaning: '', example: '', personalNote: '', status: '' };
  saving = false;
  autofilling = false;

  // Swipe state
  swipeOffset = 0;
  swipeDirection: 'left' | 'right' | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;
  private swipeThreshold = 100;

  constructor(private phraseService: PhraseService) {}

  ngOnInit(): void {
    this.loadPhrases();
  }

  get currentPhrase(): Phrase | null {
    return this.phrases[this.currentIndex] || null;
  }

  loadPhrases(): void {
    this.loading = true;
    this.phraseService.getTodayReview().subscribe({
      next: (phrases) => {
        this.phrases = phrases;
        this.currentIndex = 0;
        this.revealed = false;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  reveal(): void {
    this.revealed = true;
  }

  toggleReveal(): void {
    this.revealed = !this.revealed;
  }

  // Swipe handlers
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isSwiping = false;
    this.swipeOffset = 0;
    this.swipeDirection = null;
  }

  onTouchMove(event: TouchEvent): void {
    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = event.touches[0].clientY - this.touchStartY;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this.isSwiping = true;
      this.swipeOffset = deltaX;
      
      if (deltaX < -30) {
        this.swipeDirection = 'left';
      } else if (deltaX > 30) {
        this.swipeDirection = 'right';
      } else {
        this.swipeDirection = null;
      }
    }
  }

  onTouchEnd(): void {
    if (this.isSwiping && Math.abs(this.swipeOffset) > this.swipeThreshold) {
      if (this.swipeDirection === 'left') {
        this.submitReview('dontKnow');
      } else if (this.swipeDirection === 'right') {
        this.submitReview('know');
      }
    }
    
    // Reset swipe state
    this.swipeOffset = 0;
    this.swipeDirection = null;
    this.isSwiping = false;
  }

  onCardClick(event: Event): void {
    // Only toggle reveal if not swiping
    if (!this.isSwiping) {
      this.toggleReveal();
    }
  }

  submitReview(action: 'know' | 'dontKnow'): void {
    if (!this.currentPhrase || this.submitting) return;

    this.submitting = true;
    this.phraseService.submitReview(this.currentPhrase.id, { action }).subscribe({
      next: () => {
        this.submitting = false;
        if (action === 'dontKnow') {
          // Reload to get the phrase back at end of queue
          this.phrases.splice(this.currentIndex, 1);
          if (this.currentIndex >= this.phrases.length) {
            this.loadPhrases();
          } else {
            this.revealed = false;
          }
        } else {
          this.nextPhrase();
        }
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  nextPhrase(): void {
    if (this.currentIndex < this.phrases.length - 1) {
      this.currentIndex++;
      this.revealed = false;
    } else {
      this.loadPhrases();
    }
  }

  openEdit(): void {
    if (!this.currentPhrase) return;
    this.editingPhrase = this.currentPhrase;
    this.editForm = {
      text: this.currentPhrase.text,
      meaning: this.currentPhrase.meaning || '',
      example: this.currentPhrase.example || '',
      personalNote: this.currentPhrase.personalNote || '',
      status: this.currentPhrase.status
    };
  }

  closeEdit(): void {
    this.editingPhrase = null;
  }

  saveEdit(): void {
    if (!this.editingPhrase || this.saving) return;
    
    this.saving = true;
    this.phraseService.updatePhrase(this.editingPhrase.id, this.editForm).subscribe({
      next: (updated) => {
        const index = this.phrases.findIndex(p => p.id === updated.id);
        if (index !== -1) {
          this.phrases[index] = updated;
        }
        this.saving = false;
        this.editingPhrase = null;
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  deletePhrase(): void {
    if (!this.editingPhrase || this.saving) return;
    if (!confirm('Delete this phrase?')) return;

    this.saving = true;
    const id = this.editingPhrase.id;
    this.phraseService.deletePhrase(id).subscribe({
      next: () => {
        this.phrases = this.phrases.filter(p => p.id !== id);
        this.saving = false;
        this.editingPhrase = null;
        if (this.currentIndex >= this.phrases.length) {
          this.currentIndex = Math.max(0, this.phrases.length - 1);
        }
        this.revealed = false;
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  autofill(): void {
    if (!this.editForm.text.trim() || this.autofilling) return;

    this.autofilling = true;
    this.phraseService.autofillPhrase(this.editForm.text.trim()).subscribe({
      next: (result) => {
        this.editForm.meaning = result.meaning;
        this.editForm.example = result.example;
        this.editForm.personalNote = result.personalNote;
        this.autofilling = false;
      },
      error: () => {
        this.autofilling = false;
      }
    });
  }
}
