import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface AwesomeApiResponse {
  USDBRL?: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  };
  EURBRL?: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  };
}

export interface ExchangeRateData {
  USD: number;
  EUR: number;
  BRL: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateApiService {
  private readonly API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';

  constructor(private http: HttpClient) {}

  /**
   * Fetches current exchange rates from AwesomeAPI
   */
  getCurrentRates(): Observable<ExchangeRateData> {
    return this.http.get<AwesomeApiResponse>(this.API_URL).pipe(
      map(response => {
        const usdRate = response.USDBRL ? parseFloat(response.USDBRL.bid) : 5.0;
        const eurRate = response.EURBRL ? parseFloat(response.EURBRL.bid) : 5.5;

        return {
          USD: usdRate,
          EUR: eurRate,
          BRL: 1.0,
          timestamp: new Date()
        };
      }),
      catchError(error => {
        console.error('Error fetching exchange rates:', error);
        // Return default rates if API fails
        return of({
          USD: 5.0,
          EUR: 5.5,
          BRL: 1.0,
          timestamp: new Date()
        });
      })
    );
  }
}
