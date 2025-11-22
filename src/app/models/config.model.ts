import { Currency } from './investment.model';

export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy';
export type NumberFormat = 'pt-BR' | 'en-US'; // 9.999,99 or 9,999.99

export interface AppConfig {
  baseCurrency: Currency;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  exchangeRates: ExchangeRates;
  benchmarkData: BenchmarkData;
  lastUpdated: Date;
}

export interface ExchangeRates {
  [key: string]: { // Date in ISO format
    USD: number;
    EUR: number;
    BRL: number;
  };
}

export interface BenchmarkData {
  [key: string]: { // Date in ISO format
    CDI: number;
    IBOVESPA: number;
    DOLLAR: number;
  };
}

export interface BackupData {
  version: string;
  exportDate: Date;
  config: AppConfig;
  investments: any[];
  transactions: any[];
  institutions: any[];
}
