import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { Investment, Transaction, Currency, InvestmentType } from '../models/investment.model';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private readonly INVESTMENTS_KEY = 'investments';
  private readonly TRANSACTIONS_KEY = 'transactions';

  private investmentsSubject: BehaviorSubject<Investment[]>;
  private transactionsSubject: BehaviorSubject<Transaction[]>;

  constructor(private storage: StorageService) {
    const investments = this.loadInvestments();
    const transactions = this.loadTransactions();

    this.investmentsSubject = new BehaviorSubject<Investment[]>(investments);
    this.transactionsSubject = new BehaviorSubject<Transaction[]>(transactions);
  }

  private loadInvestments(): Investment[] {
    const stored = this.storage.get<Investment[]>(this.INVESTMENTS_KEY);
    return stored || [];
  }

  private loadTransactions(): Transaction[] {
    const stored = this.storage.get<Transaction[]>(this.TRANSACTIONS_KEY);
    return stored || [];
  }

  private saveInvestments(investments: Investment[]): void {
    this.storage.set(this.INVESTMENTS_KEY, investments);
    this.investmentsSubject.next(investments);
  }

  private saveTransactions(transactions: Transaction[]): void {
    this.storage.set(this.TRANSACTIONS_KEY, transactions);
    this.transactionsSubject.next(transactions);
  }

  // Observable streams
  getInvestments(): Observable<Investment[]> {
    return this.investmentsSubject.asObservable();
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  // Get single investment
  getInvestment(id: string): Investment | undefined {
    return this.investmentsSubject.value.find(inv => inv.id === id);
  }

  // Get transactions for an investment
  getInvestmentTransactions(investmentId: string): Transaction[] {
    return this.transactionsSubject.value
      .filter(t => t.investmentId === investmentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Create investment
  createInvestment(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'transactions'>): Investment {
    const investment: Investment = {
      ...data,
      id: this.generateId(),
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const investments = [...this.investmentsSubject.value, investment];
    this.saveInvestments(investments);

    return investment;
  }

  // Update investment
  updateInvestment(id: string, data: Partial<Investment>): Investment | undefined {
    const investments = this.investmentsSubject.value;
    const index = investments.findIndex(inv => inv.id === id);

    if (index === -1) {
      return undefined;
    }

    const updated: Investment = {
      ...investments[index],
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    investments[index] = updated;
    this.saveInvestments(investments);

    return updated;
  }

  // Delete investment
  deleteInvestment(id: string): boolean {
    const investments = this.investmentsSubject.value.filter(inv => inv.id !== id);
    const transactions = this.transactionsSubject.value.filter(t => t.investmentId !== id);

    this.saveInvestments(investments);
    this.saveTransactions(transactions);

    return true;
  }

  // Add transaction
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId()
    };

    const transactions = [...this.transactionsSubject.value, newTransaction];
    this.saveTransactions(transactions);

    // Update investment's updatedAt
    this.updateInvestment(transaction.investmentId, {});

    return newTransaction;
  }

  // Add multiple transactions (bulk)
  addTransactions(transactions: Omit<Transaction, 'id'>[]): Transaction[] {
    const newTransactions = transactions.map(t => ({
      ...t,
      id: this.generateId()
    }));

    const allTransactions = [...this.transactionsSubject.value, ...newTransactions];
    this.saveTransactions(allTransactions);

    // Update investment's updatedAt for all affected investments
    const investmentIds = new Set(transactions.map(t => t.investmentId));
    investmentIds.forEach(id => this.updateInvestment(id, {}));

    return newTransactions;
  }

  // Update transaction
  updateTransaction(id: string, data: Partial<Transaction>): Transaction | undefined {
    const transactions = this.transactionsSubject.value;
    const index = transactions.findIndex(t => t.id === id);

    if (index === -1) {
      return undefined;
    }

    const updated: Transaction = {
      ...transactions[index],
      ...data,
      id // Ensure ID doesn't change
    };

    transactions[index] = updated;
    this.saveTransactions(transactions);

    // Update investment's updatedAt
    this.updateInvestment(updated.investmentId, {});

    return updated;
  }

  // Delete transaction
  deleteTransaction(id: string): boolean {
    const transaction = this.transactionsSubject.value.find(t => t.id === id);
    if (!transaction) {
      return false;
    }

    const transactions = this.transactionsSubject.value.filter(t => t.id !== id);
    this.saveTransactions(transactions);

    // Update investment's updatedAt
    this.updateInvestment(transaction.investmentId, {});

    return true;
  }

  // Calculate current balance for an investment
  getCurrentBalance(investmentId: string): number {
    const investment = this.getInvestment(investmentId);
    if (!investment) {
      return 0;
    }

    const transactions = this.getInvestmentTransactions(investmentId);
    let balance = investment.initialValue;

    for (const transaction of transactions) {
      switch (transaction.type) {
        case 'DEPOSIT':
          balance += transaction.amount;
          break;
        case 'WITHDRAWAL':
          balance -= transaction.amount;
          break;
        case 'BALANCE_UPDATE':
          balance = transaction.balance || balance;
          break;
      }
    }

    return balance;
  }

  // Get all data for backup
  getAllData(): { investments: Investment[]; transactions: Transaction[] } {
    return {
      investments: this.investmentsSubject.value,
      transactions: this.transactionsSubject.value
    };
  }

  // Restore all data from backup
  restoreAllData(data: { investments: Investment[]; transactions: Transaction[] }): void {
    this.saveInvestments(data.investments);
    this.saveTransactions(data.transactions);
  }

  // Clear all data
  clearAll(): void {
    this.saveInvestments([]);
    this.saveTransactions([]);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
