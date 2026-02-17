import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { Phrase, CreatePhraseDto, ReviewActionDto } from '../models/phrase.model';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc
} from 'firebase/firestore';

interface DbPhrase {
  id: string;
  text: string;
  meaning: string | null;
  example: string | null;
  personal_note: string | null;
  status: number;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhraseService {
  constructor(private firebase: FirebaseService) {}

  private get phrasesRef() {
    return collection(this.firebase.firestore, 'phrases');
  }

  private mapDbToPhrase(db: DbPhrase): Phrase {
    const statusMap: Record<number, 'New' | 'Learning' | 'Mastered'> = {
      0: 'New',
      1: 'Learning',
      2: 'Mastered'
    };
    return {
      id: db.id,
      text: db.text,
      meaning: db.meaning,
      example: db.example,
      personalNote: db.personal_note,
      status: statusMap[db.status] || 'New',
      createdAt: db.created_at,
      lastReviewedAt: db.last_reviewed_at,
      nextReviewAt: db.next_review_at
    };
  }

  private mapStatusToDb(status: 'New' | 'Learning' | 'Mastered'): number {
    const map: Record<string, number> = { 'New': 0, 'Learning': 1, 'Mastered': 2 };
    return map[status] ?? 0;
  }

  private docToDbPhrase(docSnap: any): DbPhrase {
    const data = docSnap.data();
    return { id: docSnap.id, ...data } as DbPhrase;
  }

  getTodayReview(): Observable<Phrase[]> {
    const now = new Date().toISOString();
    return from(this.fetchTodayReview(now));
  }

  private async fetchTodayReview(now: string): Promise<Phrase[]> {
    const snapshot = await getDocs(this.phrasesRef);
    const all = snapshot.docs.map(d => this.docToDbPhrase(d));
    return all
      .filter(p => p.status !== 2 && p.next_review_at <= now)
      .sort((a, b) => a.next_review_at.localeCompare(b.next_review_at))
      .map(p => this.mapDbToPhrase(p));
  }

  createPhrase(dto: CreatePhraseDto): Observable<Phrase> {
    const now = new Date().toISOString();
    return from(this.addPhrase(dto, now));
  }

  private async addPhrase(dto: CreatePhraseDto, now: string): Promise<Phrase> {
    const data = {
      text: dto.text,
      meaning: dto.meaning || null,
      example: dto.example || null,
      personal_note: dto.personalNote || null,
      status: 0,
      created_at: now,
      last_reviewed_at: null,
      next_review_at: now
    };
    const docRef = await addDoc(this.phrasesRef, data);
    return this.mapDbToPhrase({ id: docRef.id, ...data });
  }

  updatePhrase(id: string, dto: CreatePhraseDto & { status?: string }): Observable<Phrase> {
    return from(this.updatePhraseDoc(id, dto));
  }

  private async updatePhraseDoc(id: string, dto: CreatePhraseDto & { status?: string }): Promise<Phrase> {
    const updateData: { [key: string]: string | number | null } = {
      text: dto.text,
      meaning: dto.meaning || null,
      example: dto.example || null,
      personal_note: dto.personalNote || null
    };

    if (dto.status) {
      updateData['status'] = this.mapStatusToDb(dto.status as 'New' | 'Learning' | 'Mastered');
    }

    const docRef = doc(this.firebase.firestore, 'phrases', id);
    await updateDoc(docRef, updateData);
    const updated = await getDoc(docRef);
    return this.mapDbToPhrase(this.docToDbPhrase(updated));
  }

  submitReview(id: string, action: ReviewActionDto): Observable<Phrase> {
    return from(this.processReview(id, action.action)).pipe(
      map(phrase => {
        if (!phrase) throw new Error('Phrase not found');
        return phrase;
      })
    );
  }

  private async processReview(id: string, action: 'know' | 'dontKnow'): Promise<Phrase | null> {
    const docRef = doc(this.firebase.firestore, 'phrases', id);
    const phraseSnap = await getDoc(docRef);

    if (!phraseSnap.exists()) return null;

    const now = new Date().toISOString();
    let newStatus: number;
    let nextReviewAt: string;

    if (action === 'know') {
      // First know -> Learning, schedule for later review
      newStatus = 1; // Learning
      nextReviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day from now
    } else {
      // Don't know - keep in Learning, show again soon
      newStatus = 1;
      nextReviewAt = new Date(Date.now() + 1000).toISOString(); // 1 second from now
    }

    await updateDoc(docRef, {
      status: newStatus,
      last_reviewed_at: now,
      next_review_at: nextReviewAt
    });

    const updated = await getDoc(docRef);
    return this.mapDbToPhrase(this.docToDbPhrase(updated));
  }

  getAllPhrases(search?: string, status?: string): Observable<Phrase[]> {
    return from(this.fetchAllPhrases(search, status));
  }

  private async fetchAllPhrases(search?: string, status?: string): Promise<Phrase[]> {
    const snapshot = await getDocs(this.phrasesRef);
    let phrases = snapshot.docs
      .map(d => this.mapDbToPhrase(this.docToDbPhrase(d)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (status) {
      phrases = phrases.filter(p => p.status === status);
    }

    if (search) {
      const lower = search.toLowerCase();
      phrases = phrases.filter(p => p.text.toLowerCase().includes(lower));
    }

    return phrases;
  }

  deletePhrase(id: string): Observable<void> {
    const docRef = doc(this.firebase.firestore, 'phrases', id);
    return from(deleteDoc(docRef));
  }

  autofillPhrase(text: string): Observable<{ meaning: string; example: string; personalNote: string }> {
    return from(this.callGroqApi(text));
  }

  private async callGroqApi(phrase: string): Promise<{ meaning: string; example: string; personalNote: string }> {
    const apiKey = environment.groqApiKey;
    if (!apiKey) {
      throw new Error('GROQ API key not configured');
    }

    const prompt = `For the phrase or word "${phrase}", provide:
1. A clear, concise meaning/definition
2. An example sentence using it naturally
3. A memorable tip or note to help remember it

Respond ONLY with valid JSON in this exact format, no other text:
{"meaning": "...", "example": "...", "personalNote": "..."}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a helpful language learning assistant. Respond only with valid JSON, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('Failed to call GROQ API');
    }

    const json = await response.json();
    let content = json.choices[0].message.content.trim();

    // Clean up potential markdown formatting
    if (content.startsWith('```json')) content = content.slice(7);
    if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    const result = JSON.parse(content);
    return {
      meaning: result.meaning || '',
      example: result.example || '',
      personalNote: result.personalNote || ''
    };
  }
}
