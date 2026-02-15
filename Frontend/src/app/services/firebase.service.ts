import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private _firestore: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this._firestore = getFirestore(this.app);
  }

  get firestore(): Firestore {
    return this._firestore;
  }
}
