import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Phrase, CreatePhraseDto, ReviewActionDto } from '../models/phrase.model';

@Injectable({
  providedIn: 'root'
})
export class PhraseService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    // Use API_URL from window if set (for production), otherwise use relative path
    this.apiUrl = (window as any).API_URL || '/api';
  }

  getTodayReview(): Observable<Phrase[]> {
    return this.http.get<Phrase[]>(`${this.apiUrl}/review/today`);
  }

  createPhrase(dto: CreatePhraseDto): Observable<Phrase> {
    return this.http.post<Phrase>(`${this.apiUrl}/phrases`, dto);
  }

  updatePhrase(id: string, dto: CreatePhraseDto): Observable<Phrase> {
    return this.http.put<Phrase>(`${this.apiUrl}/phrases/${id}`, dto);
  }

  submitReview(id: string, action: ReviewActionDto): Observable<Phrase> {
    return this.http.post<Phrase>(`${this.apiUrl}/review/${id}`, action);
  }

  getAllPhrases(search?: string, status?: string): Observable<Phrase[]> {
    const params: string[] = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    const queryString = params.length ? `?${params.join('&')}` : '';
    return this.http.get<Phrase[]>(`${this.apiUrl}/phrases${queryString}`);
  }

  deletePhrase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/phrases/${id}`);
  }

  autofillPhrase(text: string): Observable<{ meaning: string; example: string; personalNote: string }> {
    return this.http.post<{ meaning: string; example: string; personalNote: string }>(
      `${this.apiUrl}/phrases/autofill`, 
      { text }
    );
  }
}
