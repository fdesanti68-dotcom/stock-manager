import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface BenchmarkRates {
  CDI: number;
  IBOVESPA: number;
  DOLLAR: number;
  date: string;
}

/**
 * Service to fetch benchmark data (CDI, IBOVESPA, Dollar) from HG Brasil API
 * API Documentation: https://hgbrasil.com/status/finance
 */
@Injectable({
  providedIn: 'root'
})
export class BenchmarkApiService {
  // Free tier API key - Replace with your own key from https://console.hgbrasil.com/
  private readonly API_KEY = 'free'; // Using free tier without key
  private readonly BASE_URL = 'https://api.hgbrasil.com/finance';

  constructor(private http: HttpClient) {}

  /**
   * Fetches current benchmark data from HG Brasil API
   * Returns CDI, IBOVESPA, and Dollar (USD/BRL) rates
   */
  getCurrentBenchmarkData(): Observable<BenchmarkRates> {
    const url = this.API_KEY === 'free'
      ? `${this.BASE_URL}`
      : `${this.BASE_URL}?key=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.valid_key === false) {
          throw new Error('Invalid API key');
        }

        // Extract data from response
        const results = response.results;

        // Get Dollar (USD to BRL) from currencies
        const dollarRate = results.currencies?.USD?.buy || 0;

        // Get IBOVESPA from stocks
        const ibovespa = results.stocks?.IBOVESPA?.points || 0;

        // CDI is typically in the taxes section
        // Note: HG Brasil may not provide direct CDI values in free tier
        // We'll use Selic as a proxy or set to 0 if not available
        const cdi = results.taxes?.find((tax: any) => tax.name === 'CDI')?.value || 0;

        return {
          CDI: cdi,
          IBOVESPA: ibovespa,
          DOLLAR: dollarRate,
          date: new Date().toISOString().split('T')[0]
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches historical benchmark data for a specific date
   * Note: Historical data may require a paid plan on HG Brasil
   */
  getHistoricalBenchmarkData(date: Date): Observable<BenchmarkRates> {
    // For now, return current data as HG Brasil free tier doesn't support historical queries
    // In production, you would need a paid plan or alternative API
    console.warn('Historical benchmark data not available in free tier. Using current data.');
    return this.getCurrentBenchmarkData();
  }

  /**
   * Converts IBOVESPA points to percentage change from a base value
   * This is useful for chart comparisons
   */
  calculateIbovespaReturnPercentage(currentPoints: number, basePoints: number): number {
    if (basePoints === 0) return 0;
    return ((currentPoints - basePoints) / basePoints) * 100;
  }

  /**
   * Converts Dollar rate to percentage change from a base value
   * This is useful for chart comparisons
   */
  calculateDollarReturnPercentage(currentRate: number, baseRate: number): number {
    if (baseRate === 0) return 0;
    return ((currentRate - baseRate) / baseRate) * 100;
  }

  /**
   * Error handler for API requests
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching benchmark data';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Generates mock historical data for testing purposes
   * This should be removed once real historical data is available
   */
  generateMockHistoricalData(startDate: Date, endDate: Date): BenchmarkRates[] {
    const data: BenchmarkRates[] = [];
    const currentDate = new Date(startDate);

    // Starting values
    let cdi = 13.75; // Typical CDI annual rate
    let ibovespa = 120000; // Typical IBOVESPA points
    let dollar = 5.0; // Typical USD/BRL rate

    while (currentDate <= endDate) {
      // Add some random variation
      cdi += (Math.random() - 0.5) * 0.5;
      ibovespa += (Math.random() - 0.5) * 2000;
      dollar += (Math.random() - 0.5) * 0.2;

      // Keep values in reasonable ranges
      cdi = Math.max(10, Math.min(15, cdi));
      ibovespa = Math.max(100000, Math.min(140000, ibovespa));
      dollar = Math.max(4.5, Math.min(5.5, dollar));

      data.push({
        CDI: parseFloat(cdi.toFixed(2)),
        IBOVESPA: parseFloat(ibovespa.toFixed(0)),
        DOLLAR: parseFloat(dollar.toFixed(2)),
        date: currentDate.toISOString().split('T')[0]
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }
}
