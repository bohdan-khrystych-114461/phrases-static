import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PhraseService } from '../services/phrase.service';
import { CreatePhraseDto } from '../models/phrase.model';
import { HeaderComponent } from '../shared/header/header.component';

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-add-phrase',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  template: `
    <div class="container">
      <app-header leftLink="/" leftText="Cancel" title="Add Phrase" [showAdd]="false"></app-header>

      <main class="main">
        <form class="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="text">Phrase *</label>
            <div class="input-with-mic">
              <input 
                id="text" 
                type="text" 
                [(ngModel)]="phrase.text" 
                name="text"
                placeholder="Enter the phrase"
                required
              >
              @if (speechSupported && isDesktop) {
                <button 
                  type="button" 
                  class="mic-btn" 
                  [class.recording]="activeField === 'text'"
                  (click)="toggleVoiceInput('text')"
                  [title]="activeField === 'text' ? 'Stop recording' : 'Voice input'"
                >
                  {{ activeField === 'text' ? '⏹️' : '🎤' }}
                </button>
              }
              <button 
                type="button" 
                class="autofill-btn" 
                (click)="autofill()"
                [disabled]="!phrase.text.trim() || autofilling"
                title="Auto-fill with AI"
              >
                {{ autofilling ? '...' : '✨' }}
              </button>
            </div>
          </div>

          <div class="field">
            <label for="meaning">Meaning</label>
            <div class="input-with-mic">
              <textarea 
                id="meaning" 
                [(ngModel)]="phrase.meaning" 
                name="meaning"
                placeholder="What does it mean?"
                rows="3"
              ></textarea>
              @if (speechSupported && isDesktop) {
                <button 
                  type="button" 
                  class="mic-btn" 
                  [class.recording]="activeField === 'meaning'"
                  (click)="toggleVoiceInput('meaning')"
                >
                  {{ activeField === 'meaning' ? '⏹️' : '🎤' }}
                </button>
              }
            </div>
          </div>

          <div class="field">
            <label for="example">Example</label>
            <div class="input-with-mic">
              <textarea 
                id="example" 
                [(ngModel)]="phrase.example" 
                name="example"
                placeholder="Use it in a sentence"
                rows="3"
              ></textarea>
              @if (speechSupported && isDesktop) {
                <button 
                  type="button" 
                  class="mic-btn" 
                  [class.recording]="activeField === 'example'"
                  (click)="toggleVoiceInput('example')"
                >
                  {{ activeField === 'example' ? '⏹️' : '🎤' }}
                </button>
              }
            </div>
          </div>

          <div class="field">
            <label for="note">Personal Note</label>
            <div class="input-with-mic">
              <textarea 
                id="note" 
                [(ngModel)]="phrase.personalNote" 
                name="personalNote"
                placeholder="Any notes to help you remember"
                rows="2"
              ></textarea>
              @if (speechSupported && isDesktop) {
                <button 
                  type="button" 
                  class="mic-btn" 
                  [class.recording]="activeField === 'personalNote'"
                  (click)="toggleVoiceInput('personalNote')"
                >
                  {{ activeField === 'personalNote' ? '⏹️' : '🎤' }}
                </button>
              }
            </div>
          </div>

          <button type="submit" class="submit-btn" [disabled]="!phrase.text.trim() || submitting">
            {{ submitting ? 'Saving...' : 'Save Phrase' }}
          </button>

          @if (error) {
            <div class="error">{{ error }}</div>
          }

          @if (success) {
            <div class="success">Phrase added successfully!</div>
          }
        </form>
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

    .form {
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .field {
      margin-bottom: 20px;
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
    .field textarea {
      width: 100%;
      padding: 12px 14px;
      font-size: 1rem;
      border: none;
      border-radius: 10px;
      background: #f7f8fa;
      transition: background 0.2s, box-shadow 0.2s;
      resize: vertical;
      min-height: auto;
    }

    .field textarea {
      min-height: 70px;
    }

    .field input:focus,
    .field textarea:focus {
      background: #fff;
      box-shadow: 0 0 0 2px #667eea;
      outline: none;
    }

    .submit-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .submit-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error {
      margin-top: 16px;
      padding: 12px;
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
      text-align: center;
    }

    .success {
      margin-top: 16px;
      padding: 12px;
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 8px;
      text-align: center;
    }

    .input-with-mic {
      position: relative;
      display: flex;
      gap: 8px;
    }

    .input-with-mic input,
    .input-with-mic textarea {
      flex: 1;
    }

    .mic-btn {
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      border-radius: 12px;
      background: #f5f5f5;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
      align-self: flex-start;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
    }

    .mic-btn:hover {
      background: #e0e0e0;
    }

    .mic-btn:active {
      transform: scale(0.95);
    }

    .mic-btn.recording {
      background: #ef5350;
      color: white;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .autofill-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
      align-self: flex-start;
    }

    .autofill-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .autofill-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class AddPhraseComponent implements OnDestroy {
  phrase: CreatePhraseDto = {
    text: '',
    meaning: '',
    example: '',
    personalNote: ''
  };

  submitting = false;
  error = '';
  success = false;
  autofilling = false;
  
  speechSupported = false;
  isDesktop = false;
  activeField: string | null = null;
  private recognition: any = null;

  constructor(
    private phraseService: PhraseService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.checkIfDesktop();
    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.stopRecognition();
  }

  private checkIfDesktop(): void {
    // Check if device is desktop (no touch or large screen)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLargeScreen = window.innerWidth >= 1024;
    this.isDesktop = !hasTouch || isLargeScreen;
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.ngZone.run(() => {
          if (this.activeField) {
            this.appendToField(this.activeField, transcript);
          }
          this.activeField = null;
        });
      };

      this.recognition.onerror = () => {
        this.ngZone.run(() => {
          this.activeField = null;
        });
      };

      this.recognition.onend = () => {
        this.ngZone.run(() => {
          this.activeField = null;
        });
      };
    }
  }

  toggleVoiceInput(field: string): void {
    if (this.activeField === field) {
      this.stopRecognition();
    } else {
      this.stopRecognition();
      this.activeField = field;
      this.recognition?.start();
    }
  }

  private stopRecognition(): void {
    if (this.recognition && this.activeField) {
      this.recognition.stop();
    }
    this.activeField = null;
  }

  private appendToField(field: string, text: string): void {
    const key = field as keyof CreatePhraseDto;
    const current = this.phrase[key] || '';
    this.phrase[key] = current ? `${current} ${text}` : text;
  }

  onSubmit(): void {
    if (!this.phrase.text.trim() || this.submitting) return;

    this.submitting = true;
    this.error = '';
    this.success = false;

    this.phraseService.createPhrase(this.phrase).subscribe({
      next: () => {
        this.submitting = false;
        this.success = true;
        this.phrase = { text: '', meaning: '', example: '', personalNote: '' };
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (err: any) => {
        this.submitting = false;
        this.error = err.error?.message || 'Failed to save phrase';
      }
    });
  }

  autofill(): void {
    if (!this.phrase.text.trim() || this.autofilling) return;

    this.autofilling = true;
    this.error = '';

    this.phraseService.autofillPhrase(this.phrase.text.trim()).subscribe({
      next: (result) => {
        this.phrase.meaning = result.meaning;
        this.phrase.example = result.example;
        this.phrase.personalNote = result.personalNote;
        this.autofilling = false;
      },
      error: (err: any) => {
        this.autofilling = false;
        this.error = err.error || 'AI auto-fill unavailable. Set OPENAI_API_KEY to enable.';
      }
    });
  }
}
