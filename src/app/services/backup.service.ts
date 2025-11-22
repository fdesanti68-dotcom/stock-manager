import { Injectable } from '@angular/core';
import { InvestmentService } from './investment.service';
import { CurrencyService } from './currency.service';
import { EncryptionService } from './encryption.service';
import { InstitutionService } from './institution.service';
import { BackupData } from '../models/config.model';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly VERSION = '1.0.0';

  constructor(
    private investmentService: InvestmentService,
    private currencyService: CurrencyService,
    private encryptionService: EncryptionService,
    private institutionService: InstitutionService
  ) {}

  /**
   * Creates an encrypted backup of all data
   */
  async createBackup(password: string): Promise<Blob> {
    const data = this.investmentService.getAllData();
    const institutions = this.institutionService.getAllData();
    let config: any;

    this.currencyService.getConfig().subscribe(c => config = c).unsubscribe();

    const backupData: BackupData = {
      version: this.VERSION,
      exportDate: new Date(),
      config: config,
      investments: data.investments,
      transactions: data.transactions,
      institutions: institutions
    };

    const encrypted = this.encryptionService.encrypt(backupData, password);
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });

    return blob;
  }

  /**
   * Downloads the backup file
   */
  downloadBackup(blob: Blob, filename?: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const date = new Date().toISOString().split('T')[0];
    link.download = filename || `stocks-manager-backup-${date}.smb`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  /**
   * Restores data from an encrypted backup file
   */
  async restoreBackup(file: File, password: string): Promise<boolean> {
    try {
      const encrypted = await this.readFileAsText(file);
      const backupData = this.encryptionService.decrypt<BackupData>(encrypted, password);

      // Validate backup data structure
      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup file format');
      }

      // Restore data
      this.investmentService.restoreAllData({
        investments: backupData.investments,
        transactions: backupData.transactions
      });

      // Restore institutions (with backward compatibility)
      if (backupData.institutions) {
        this.institutionService.restoreAllData(backupData.institutions);
      }

      // Restore config
      this.currencyService.setBaseCurrency(backupData.config.baseCurrency);

      // Update exchange rates and benchmark data
      const config = backupData.config;
      Object.keys(config.exchangeRates).forEach(dateKey => {
        const date = new Date(dateKey);
        this.currencyService.updateExchangeRates(date, config.exchangeRates[dateKey]);
      });

      Object.keys(config.benchmarkData).forEach(dateKey => {
        const date = new Date(dateKey);
        this.currencyService.updateBenchmarkData(date, config.benchmarkData[dateKey]);
      });

      return true;
    } catch (error) {
      console.error('Restore backup error:', error);
      throw error;
    }
  }

  /**
   * Reads a file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validates backup data structure
   */
  private validateBackupData(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      'version' in data &&
      'exportDate' in data &&
      'config' in data &&
      'investments' in data &&
      'transactions' in data &&
      Array.isArray(data.investments) &&
      Array.isArray(data.transactions)
      // institutions is optional for backward compatibility
    );
  }

  /**
   * Gets backup file info without decrypting all data
   */
  async getBackupInfo(file: File, password: string): Promise<{
    version: string;
    exportDate: Date;
    investmentCount: number;
    transactionCount: number;
  }> {
    try {
      const encrypted = await this.readFileAsText(file);
      const backupData = this.encryptionService.decrypt<BackupData>(encrypted, password);

      return {
        version: backupData.version,
        exportDate: new Date(backupData.exportDate),
        investmentCount: backupData.investments.length,
        transactionCount: backupData.transactions.length
      };
    } catch (error) {
      throw new Error('Failed to read backup file. Please check your password.');
    }
  }
}
