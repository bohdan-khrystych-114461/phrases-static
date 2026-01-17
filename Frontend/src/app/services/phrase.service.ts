import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { Phrase, CreatePhraseDto, ReviewActionDto } from '../models/phrase.model';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

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
  constructor(private supabase: SupabaseService) {}

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

  getTodayReview(): Observable<Phrase[]> {
    const now = new Date().toISOString();
    return from(
      this.supabase.client
        .from('phrases')
        .select('*')
        .neq('status', 2) // Not Mastered
        .lte('next_review_at', now)
        .order('next_review_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as DbPhrase[]).map(d => this.mapDbToPhrase(d));
      })
    );
  }

  createPhrase(dto: CreatePhraseDto): Observable<Phrase> {
    const now = new Date().toISOString();
    return from(
      this.supabase.client
        .from('phrases')
        .insert({
          text: dto.text,
          meaning: dto.meaning || null,
          example: dto.example || null,
          personal_note: dto.personalNote || null,
          status: 0,
          created_at: now,
          next_review_at: now
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDbToPhrase(data as DbPhrase);
      })
    );
  }

  updatePhrase(id: string, dto: CreatePhraseDto & { status?: string }): Observable<Phrase> {
    const updateData: Record<string, unknown> = {
      text: dto.text,
      meaning: dto.meaning || null,
      example: dto.example || null,
      personal_note: dto.personalNote || null
    };

    if (dto.status) {
      updateData['status'] = this.mapStatusToDb(dto.status as 'New' | 'Learning' | 'Mastered');
    }

    return from(
      this.supabase.client
        .from('phrases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDbToPhrase(data as DbPhrase);
      })
    );
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
    const { data: phrase, error: fetchError } = await this.supabase.client
      .from('phrases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !phrase) return null;

    const now = new Date().toISOString();
    let newStatus: number;
    let nextReviewAt: string;

    if (action === 'know') {
      // Mastered - won't appear again
      newStatus = 2;
      nextReviewAt = new Date('9999-12-31').toISOString();
    } else {
      // Don't know - keep in Learning, show again soon
      newStatus = 1;
      nextReviewAt = new Date(Date.now() + 1000).toISOString(); // 1 second from now
    }

    const { data: updated, error: updateError } = await this.supabase.client
      .from('phrases')
      .update({
        status: newStatus,
        last_reviewed_at: now,
        next_review_at: nextReviewAt
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return this.mapDbToPhrase(updated as DbPhrase);
  }

  getAllPhrases(search?: string, status?: string): Observable<Phrase[]> {
    return from(this.fetchAllPhrases(search, status));
  }

  private async fetchAllPhrases(search?: string, status?: string): Promise<Phrase[]> {
    let query = this.supabase.client
      .from('phrases')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      const statusNum = this.mapStatusToDb(status as 'New' | 'Learning' | 'Mastered');
      query = query.eq('status', statusNum);
    }

    if (search) {
      query = query.ilike('text', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as DbPhrase[]).map(d => this.mapDbToPhrase(d));
  }

  deletePhrase(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('phrases')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  autofillPhrase(text: string): Observable<{ meaning: string; example: string; personalNote: string }> {
    return from(this.callGroqApi(text));
  }

  private async callGroqApi(phrase: string): Promise<{ meaning: string; example: string; personalNote: string }> {
    const apiKey = window.APP_CONFIG?.groqApiKey || environment.groqApiKey;
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
