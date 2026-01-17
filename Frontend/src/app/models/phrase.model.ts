export interface Phrase {
  id: string;
  text: string;
  meaning: string | null;
  example: string | null;
  personalNote: string | null;
  status: 'New' | 'Learning' | 'Mastered';
  createdAt: string;
  lastReviewedAt: string | null;
  nextReviewAt: string;
}

export interface CreatePhraseDto {
  text: string;
  meaning?: string;
  example?: string;
  personalNote?: string;
}

export interface ReviewActionDto {
  action: 'know' | 'dontKnow';
}
