import { Injectable } from '@angular/core';
import { InvestmentService } from './investment.service';
import { CurrencyService } from './currency.service';
import { Investment, Transaction, PerformanceMetrics, TransactionType } from '../models/investment.model';

export interface PeriodData {
  date: Date;
  balance: number;
  invested: number;
  profitability: number;
  cdi?: number;
  ibovespa?: number;
  dollar?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfitabilityService {

  constructor(
    private investmentService: InvestmentService,
    private currencyService: CurrencyService
  ) {}

  /**
   * Calculates performance metrics for an investment over a period
   */
  calculatePerformance(investmentId: string, startDate: Date, endDate: Date = new Date()): PerformanceMetrics {
    const investment = this.investmentService.getInvestment(investmentId);
    if (!investment) {
      return this.getEmptyMetrics(startDate, endDate);
    }

    const transactions = this.investmentService.getInvestmentTransactions(investmentId);
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    let totalInvested = investment.initialValue;
    let currentBalance = investment.initialValue;

    // Calculate for transactions up to end date
    for (const transaction of transactions) {
      const tDate = new Date(transaction.date);
      if (tDate > endDate) break;

      switch (transaction.type) {
        case TransactionType.DEPOSIT:
          totalInvested += transaction.amount;
          currentBalance += transaction.amount;
          break;
        case TransactionType.WITHDRAWAL:
          totalInvested -= transaction.amount;
          currentBalance -= transaction.amount;
          break;
        case TransactionType.BALANCE_UPDATE:
          currentBalance = transaction.balance || currentBalance;
          break;
      }
    }

    const totalReturn = currentBalance - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentBalance,
      totalReturn,
      returnPercentage,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  /**
   * Calculates performance for all investments combined
   */
  calculateOverallPerformance(startDate: Date, endDate: Date = new Date()): PerformanceMetrics {
    const investments = this.investmentService.getInvestments();
    let totalInvested = 0;
    let currentBalance = 0;

    investments.subscribe(invs => {
      invs.forEach(investment => {
        const metrics = this.calculatePerformance(investment.id, startDate, endDate);
        totalInvested += this.currencyService.convertToBaseCurrency(
          metrics.totalInvested,
          investment.currency,
          endDate
        );
        currentBalance += this.currencyService.convertToBaseCurrency(
          metrics.currentBalance,
          investment.currency,
          endDate
        );
      });
    });

    const totalReturn = currentBalance - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentBalance,
      totalReturn,
      returnPercentage,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  /**
   * Gets historical data points for chart visualization
   */
  getHistoricalData(investmentId: string, startDate: Date, endDate: Date = new Date()): PeriodData[] {
    const investment = this.investmentService.getInvestment(investmentId);
    if (!investment) {
      return [];
    }

    const transactions = this.investmentService.getInvestmentTransactions(investmentId)
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      });

    const dataPoints: PeriodData[] = [];
    let currentBalance = investment.initialValue;
    let totalInvested = investment.initialValue;

    // Add start point
    dataPoints.push({
      date: new Date(investment.startDate),
      balance: currentBalance,
      invested: totalInvested,
      profitability: 0
    });

    // Process each transaction
    for (const transaction of transactions) {
      switch (transaction.type) {
        case TransactionType.DEPOSIT:
          totalInvested += transaction.amount;
          currentBalance += transaction.amount;
          break;
        case TransactionType.WITHDRAWAL:
          totalInvested -= transaction.amount;
          currentBalance -= transaction.amount;
          break;
        case TransactionType.BALANCE_UPDATE:
          currentBalance = transaction.balance || currentBalance;
          break;
      }

      const profitability = totalInvested > 0 ? ((currentBalance - totalInvested) / totalInvested) * 100 : 0;
      const benchmarks = this.currencyService.getBenchmarkData(new Date(transaction.date));

      dataPoints.push({
        date: new Date(transaction.date),
        balance: currentBalance,
        invested: totalInvested,
        profitability,
        cdi: benchmarks.CDI,
        ibovespa: benchmarks.IBOVESPA,
        dollar: benchmarks.DOLLAR
      });
    }

    return dataPoints;
  }

  /**
   * Gets consolidated data by investment type
   */
  getConsolidatedByType(): Map<string, PerformanceMetrics> {
    const result = new Map<string, PerformanceMetrics>();
    const investments = this.investmentService.getInvestments();

    investments.subscribe(invs => {
      invs.forEach(investment => {
        const type = investment.type;
        const metrics = this.calculatePerformance(
          investment.id,
          new Date(investment.startDate),
          new Date()
        );

        const converted = {
          totalInvested: this.currencyService.convertToBaseCurrency(
            metrics.totalInvested,
            investment.currency
          ),
          currentBalance: this.currencyService.convertToBaseCurrency(
            metrics.currentBalance,
            investment.currency
          ),
          totalReturn: 0,
          returnPercentage: 0,
          periodStart: metrics.periodStart,
          periodEnd: metrics.periodEnd
        };

        converted.totalReturn = converted.currentBalance - converted.totalInvested;
        converted.returnPercentage = converted.totalInvested > 0
          ? (converted.totalReturn / converted.totalInvested) * 100
          : 0;

        if (result.has(type)) {
          const existing = result.get(type)!;
          existing.totalInvested += converted.totalInvested;
          existing.currentBalance += converted.currentBalance;
          existing.totalReturn = existing.currentBalance - existing.totalInvested;
          existing.returnPercentage = existing.totalInvested > 0
            ? (existing.totalReturn / existing.totalInvested) * 100
            : 0;
        } else {
          result.set(type, converted);
        }
      });
    });

    return result;
  }

  /**
   * Gets transactions for current year (deposits and withdrawals)
   */
  getCurrentYearTransactions(): { deposits: Transaction[]; withdrawals: Transaction[] } {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const deposits: Transaction[] = [];
    const withdrawals: Transaction[] = [];

    this.investmentService.getTransactions().subscribe(transactions => {
      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate >= startOfYear && tDate <= endOfYear) {
          if (t.type === TransactionType.DEPOSIT) {
            deposits.push(t);
          } else if (t.type === TransactionType.WITHDRAWAL) {
            withdrawals.push(t);
          }
        }
      });
    });

    return { deposits, withdrawals };
  }

  private getEmptyMetrics(startDate: Date, endDate: Date): PerformanceMetrics {
    return {
      totalInvested: 0,
      currentBalance: 0,
      totalReturn: 0,
      returnPercentage: 0,
      periodStart: startDate,
      periodEnd: endDate
    };
  }
}
