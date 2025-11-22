import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { Institution, InstitutionType } from '../models/institution.model';

@Injectable({
  providedIn: 'root'
})
export class InstitutionService {
  private readonly INSTITUTIONS_KEY = 'institutions';

  private institutionsSubject: BehaviorSubject<Institution[]>;

  constructor(private storage: StorageService) {
    const institutions = this.loadInstitutions();
    this.institutionsSubject = new BehaviorSubject<Institution[]>(institutions);
  }

  private loadInstitutions(): Institution[] {
    const stored = this.storage.get<Institution[]>(this.INSTITUTIONS_KEY);
    return stored || [];
  }

  private saveInstitutions(institutions: Institution[]): void {
    this.storage.set(this.INSTITUTIONS_KEY, institutions);
    this.institutionsSubject.next(institutions);
  }

  // Observable stream
  getInstitutions(): Observable<Institution[]> {
    return this.institutionsSubject.asObservable();
  }

  // Get current institutions value
  getInstitutionsValue(): Institution[] {
    return this.institutionsSubject.value;
  }

  // Get single institution
  getInstitution(id: string): Institution | undefined {
    return this.institutionsSubject.value.find(inst => inst.id === id);
  }

  // Create institution
  createInstitution(data: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>): Institution {
    const institution: Institution = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const institutions = [...this.institutionsSubject.value, institution];
    this.saveInstitutions(institutions);

    return institution;
  }

  // Update institution
  updateInstitution(id: string, data: Partial<Institution>): Institution | undefined {
    const institutions = this.institutionsSubject.value;
    const index = institutions.findIndex(inst => inst.id === id);

    if (index === -1) {
      return undefined;
    }

    const updated: Institution = {
      ...institutions[index],
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    institutions[index] = updated;
    this.saveInstitutions(institutions);

    return updated;
  }

  // Delete institution
  deleteInstitution(id: string): boolean {
    const institutions = this.institutionsSubject.value.filter(inst => inst.id !== id);

    if (institutions.length === this.institutionsSubject.value.length) {
      return false; // Institution not found
    }

    this.saveInstitutions(institutions);
    return true;
  }

  // Get all data for backup
  getAllData(): Institution[] {
    return this.institutionsSubject.value;
  }

  // Restore all data from backup
  restoreAllData(institutions: Institution[]): void {
    this.saveInstitutions(institutions);
  }

  // Clear all data
  clearAll(): void {
    this.saveInstitutions([]);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
