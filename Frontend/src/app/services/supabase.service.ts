import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    APP_CONFIG?: {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      groqApiKey?: string;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Use runtime config if available, fallback to build-time environment
    const url = window.APP_CONFIG?.supabaseUrl || environment.supabaseUrl;
    const key = window.APP_CONFIG?.supabaseAnonKey || environment.supabaseAnonKey;
    
    this.supabase = createClient(url, key);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
