import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storageSubjects: Map<string, BehaviorSubject<any>> = new Map();

  constructor() {
    // Listen to storage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key && this.storageSubjects.has(event.key)) {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        this.storageSubjects.get(event.key)?.next(newValue);
      }
    });
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);

      // Notify subscribers
      if (this.storageSubjects.has(key)) {
        this.storageSubjects.get(key)?.next(value);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save data to localStorage');
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue ?? null;
    }
  }

  watch<T>(key: string, defaultValue?: T): Observable<T | null> {
    if (!this.storageSubjects.has(key)) {
      const initialValue = this.get<T>(key, defaultValue);
      this.storageSubjects.set(key, new BehaviorSubject<T | null>(initialValue));
    }
    return this.storageSubjects.get(key)!.asObservable();
  }

  remove(key: string): void {
    localStorage.removeItem(key);
    if (this.storageSubjects.has(key)) {
      this.storageSubjects.get(key)?.next(null);
    }
  }

  clear(): void {
    localStorage.clear();
    this.storageSubjects.forEach(subject => subject.next(null));
  }

  getAllKeys(): string[] {
    return Object.keys(localStorage);
  }

  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
