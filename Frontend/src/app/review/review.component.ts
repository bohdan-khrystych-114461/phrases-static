import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PhraseService } from '../services/phrase.service';
import { Phrase } from '../models/phrase.model';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <header class="header">
        <h1>Phrase<br>Learner</h1>
        <div class="header-actions">
          <a routerLink="/dashboard" class="nav-btn">Dashboard</a>
          <a routerLink="/add" class="add-btn">+ Add</a>
        </div>
      </header>

      <main class="main">
        @if (loading) {
          <div class="loading">Loading...</div>
        } @else if (currentPhrase) {
          <div class="card">
            <div class="phrase-text">{{ currentPhrase.text }}</div>
            
            <div class="status-badge" [class]="currentPhrase.status.toLowerCase()">
              {{ currentPhrase.status }}
            </div>

            @if (!revealed) {
              <button class="reveal-btn" (click)="reveal()">
                Tap to Reveal
              </button>
            } @else {
              <div class="meaning-section">
                @if (currentPhrase.meaning) {
                  <div class="meaning">
                    <span class="label">Meaning</span>
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

              <div class="actions">
                <button class="action-btn dont-know" (click)="submitReview('dontKnow')" [disabled]="submitting">
                  ❌ Don't Know
                </button>
                <button class="action-btn know" (click)="submitReview('know')" [disabled]="submitting">
                  ✅ Know
                </button>
              </div>
            }
          </div>

          <div class="progress">
            {{ currentIndex + 1 }} / {{ phrases.length }}
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
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      padding: 16px;
      max-width: 480px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .nav-btn, .add-btn {
      background: rgba(255,255,255,0.2);
      color: white;
      padding: 8px 12px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.85rem;
      transition: background 0.2s;
      white-space: nowrap;
    }

    .nav-btn:hover, .add-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .main {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .loading {
      color: white;
      font-size: 1.2rem;
      margin-top: 100px;
    }

    .card {
      background: white;
      border-radius: 20px;
      padding: 32px 24px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }

    .phrase-text {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 24px;
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

    .reveal-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .reveal-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .meaning-section {
      text-align: left;
      margin-bottom: 24px;
    }

    .meaning, .example, .note {
      margin-bottom: 16px;
    }

    .label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .meaning-section p {
      color: #333;
      font-size: 1rem;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      flex: 1;
      padding: 16px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-btn.dont-know {
      background: #ffebee;
      color: #c62828;
    }

    .action-btn.know {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .action-btn:not(:disabled):hover {
      transform: translateY(-2px);
    }

    .progress {
      margin-top: 24px;
      color: rgba(255,255,255,0.8);
      font-size: 0.9rem;
    }

    .empty-state {
      text-align: center;
      color: white;
      margin-top: 80px;
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
}
