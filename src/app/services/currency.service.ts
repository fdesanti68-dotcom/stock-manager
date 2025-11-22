import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { ExchangeRateApiService } from './exchange-rate-api.service';
import { BenchmarkApiService } from './benchmark-api.service';
import { Currency, CurrencyLabels } from '../models/investment.model';
import { AppConfig, ExchangeRates, DateFormat, NumberFormat } from '../models/config.model';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly CONFIG_KEY = 'app_config';
  private configSubject: BehaviorSubject<AppConfig>;
  private lastFetchTime: Date | null = null;
  private lastBenchmarkFetchTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly BENCHMARK_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    private storage: StorageService,
    private exchangeRateApi: ExchangeRateApiService,
    private benchmarkApi: BenchmarkApiService
  ) {
    const config = this.loadConfig();
    this.configSubject = new BehaviorSubject<AppConfig>(config);

    // Fetch rates on initialization
    this.fetchAndUpdateRates();
    this.fetchAndUpdateBenchmarkData();
  }

  private loadConfig(): AppConfig {
    const stored = this.storage.get<AppConfig>(this.CONFIG_KEY);
    if (stored) {
      return stored;
    }

    // Default configuration
    const defaultConfig: AppConfig = {
      baseCurrency: Currency.BRL,
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'pt-BR',
      exchangeRates: this.getDefaultRates(),
      benchmarkData: {},
      lastUpdated: new Date()
    };

    this.storage.set(this.CONFIG_KEY, defaultConfig);
    return defaultConfig;
  }

  private getDefaultRates(): ExchangeRates {
    const today = new Date().toISOString().split('T')[0];
    return {
      [today]: {
        USD: 5.00,
        EUR: 5.50,
        BRL: 1.00
      }
    };
  }

  getConfig(): Observable<AppConfig> {
    return this.configSubject.asObservable();
  }

  getBaseCurrency(): Currency {
    return this.configSubject.value.baseCurrency;
  }

  setBaseCurrency(currency: Currency): void {
    const config = this.configSubject.value;
    config.baseCurrency = currency;
    config.lastUpdated = new Date();
    this.saveConfig(config);
  }

  getDateFormat(): DateFormat {
    return this.configSubject.value.dateFormat;
  }

  setDateFormat(format: DateFormat): void {
    const config = this.configSubject.value;
    config.dateFormat = format;
    config.lastUpdated = new Date();
    this.saveConfig(config);
  }

  getNumberFormat(): NumberFormat {
    return this.configSubject.value.numberFormat;
  }

  setNumberFormat(format: NumberFormat): void {
    const config = this.configSubject.value;
    config.numberFormat = format;
    config.lastUpdated = new Date();
    this.saveConfig(config);
  }

  private saveConfig(config: AppConfig): void {
    this.storage.set(this.CONFIG_KEY, config);
    this.configSubject.next(config);
  }

  /**
   * Fetches current exchange rates from API and updates config
   */
  fetchAndUpdateRates(): void {
    // Check if we need to fetch (cache expired or first time)
    if (this.lastFetchTime) {
      const timeSinceLastFetch = Date.now() - this.lastFetchTime.getTime();
      if (timeSinceLastFetch < this.CACHE_DURATION_MS) {
        return; // Use cached rates
      }
    }

    this.exchangeRateApi.getCurrentRates().subscribe({
      next: (rates) => {
        const today = new Date().toISOString().split('T')[0];
        const config = this.configSubject.value;

        config.exchangeRates[today] = {
          USD: rates.USD,
          EUR: rates.EUR,
          BRL: rates.BRL
        };

        config.lastUpdated = new Date();
        this.saveConfig(config);
        this.lastFetchTime = new Date();

        console.log('Exchange rates updated:', rates);
      },
      error: (error) => {
        console.error('Failed to fetch exchange rates:', error);
      }
    });
  }

  /**
   * Gets the exchange rate for a specific date and currency
   */
  getExchangeRate(date: Date, currency: Currency): number {
    const dateKey = date.toISOString().split('T')[0];
    const config = this.configSubject.value;

    // If exact date exists
    if (config.exchangeRates[dateKey]) {
      return config.exchangeRates[dateKey][currency] || 1;
    }

    // Find closest previous date
    const dates = Object.keys(config.exchangeRates).sort();
    for (let i = dates.length - 1; i >= 0; i--) {
      if (dates[i] <= dateKey) {
        return config.exchangeRates[dates[i]][currency] || 1;
      }
    }

    // Default to 1 if no rate found
    return 1;
  }

  /**
   * Updates exchange rates for a specific date
   */
  updateExchangeRates(date: Date, rates: { USD: number; EUR: number; BRL: number }): void {
    const dateKey = date.toISOString().split('T')[0];
    const config = this.configSubject.value;
    config.exchangeRates[dateKey] = rates;
    config.lastUpdated = new Date();
    this.saveConfig(config);
  }

  /**
   * Converts amount from one currency to base currency on a specific date
   */
  convertToBaseCurrency(amount: number, fromCurrency: Currency, date: Date = new Date()): number {
    const baseCurrency = this.getBaseCurrency();

    if (fromCurrency === baseCurrency) {
      return amount;
    }

    const fromRate = this.getExchangeRate(date, fromCurrency);
    const toRate = this.getExchangeRate(date, baseCurrency);

    // Convert to BRL first (as reference), then to target currency
    if (fromCurrency === Currency.BRL) {
      return amount / toRate;
    } else if (baseCurrency === Currency.BRL) {
      return amount * fromRate;
    } else {
      // Convert from -> BRL -> to
      const inBRL = amount * fromRate;
      return inBRL / toRate;
    }
  }

  /**
   * Formats a currency value with its symbol
   */
  formatCurrency(amount: number, currency: Currency): string {
    const symbol = CurrencyLabels[currency];
    const numberFormat = this.getNumberFormat();
    const formattedNumber = this.formatNumber(amount, numberFormat);
    return `${symbol} ${formattedNumber}`;
  }

  /**
   * Formats a number according to the configured number format
   */
  private formatNumber(value: number, format: NumberFormat): string {
    const parts = Math.abs(value).toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let formattedInteger = '';
    if (format === 'pt-BR') {
      // Brazilian format: 9.999,99
      formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${value < 0 ? '-' : ''}${formattedInteger},${decimalPart}`;
    } else {
      // US format: 9,999.99
      formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${value < 0 ? '-' : ''}${formattedInteger}.${decimalPart}`;
    }
  }

  /**
   * Gets all available currencies
   */
  getAvailableCurrencies(): Currency[] {
    return Object.values(Currency);
  }

  /**
   * Updates benchmark data (CDI, IBOVESPA, DOLLAR) for a specific date
   */
  updateBenchmarkData(date: Date, data: { CDI?: number; IBOVESPA?: number; DOLLAR?: number }): void {
    const dateKey = date.toISOString().split('T')[0];
    const config = this.configSubject.value;

    if (!config.benchmarkData[dateKey]) {
      config.benchmarkData[dateKey] = { CDI: 0, IBOVESPA: 0, DOLLAR: 0 };
    }

    config.benchmarkData[dateKey] = {
      ...config.benchmarkData[dateKey],
      ...data
    };

    config.lastUpdated = new Date();
    this.saveConfig(config);
  }

  /**
   * Gets benchmark data for a specific date
   */
  getBenchmarkData(date: Date): { CDI: number; IBOVESPA: number; DOLLAR: number } {
    const dateKey = date.toISOString().split('T')[0];
    const config = this.configSubject.value;

    if (config.benchmarkData[dateKey]) {
      return config.benchmarkData[dateKey];
    }

    // Find closest previous date
    const dates = Object.keys(config.benchmarkData).sort();
    for (let i = dates.length - 1; i >= 0; i--) {
      if (dates[i] <= dateKey) {
        return config.benchmarkData[dates[i]];
      }
    }

    return { CDI: 0, IBOVESPA: 0, DOLLAR: 0 };
  }

  /**
   * Fetches current benchmark data from API and updates config
   */
  fetchAndUpdateBenchmarkData(): void {
    // Check if we need to fetch (cache expired or first time)
    if (this.lastBenchmarkFetchTime) {
      const timeSinceLastFetch = Date.now() - this.lastBenchmarkFetchTime.getTime();
      if (timeSinceLastFetch < this.BENCHMARK_CACHE_DURATION_MS) {
        return; // Use cached data
      }
    }

    this.benchmarkApi.getCurrentBenchmarkData().subscribe({
      next: (benchmarkRates) => {
        const today = new Date().toISOString().split('T')[0];
        const config = this.configSubject.value;

        config.benchmarkData[today] = {
          CDI: benchmarkRates.CDI,
          IBOVESPA: benchmarkRates.IBOVESPA,
          DOLLAR: benchmarkRates.DOLLAR
        };

        config.lastUpdated = new Date();
        this.saveConfig(config);
        this.lastBenchmarkFetchTime = new Date();

        console.log('Benchmark data updated:', benchmarkRates);
      },
      error: (error) => {
        console.error('Failed to fetch benchmark data:', error);
      }
    });
  }

  /**
   * Populates historical benchmark data for a date range
   * This is useful for chart rendering with real data
   */
  populateHistoricalBenchmarkData(startDate: Date, endDate: Date): void {
    // For now, use mock data as HG Brasil free tier doesn't support historical data
    // In production with a paid plan, you would fetch real historical data
    const mockData = this.benchmarkApi.generateMockHistoricalData(startDate, endDate);
    const config = this.configSubject.value;

    mockData.forEach(data => {
      if (!config.benchmarkData[data.date]) {
        config.benchmarkData[data.date] = {
          CDI: data.CDI,
          IBOVESPA: data.IBOVESPA,
          DOLLAR: data.DOLLAR
        };
      }
    });

    config.lastUpdated = new Date();
    this.saveConfig(config);
    console.log(`Populated ${mockData.length} days of historical benchmark data`);
  }
}
