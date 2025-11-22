import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { InvestmentService } from '../../services/investment.service';
import { ProfitabilityService } from '../../services/profitability.service';
import { CurrencyService } from '../../services/currency.service';
import { PerformanceMetrics, Transaction, TransactionType, InvestmentTypeLabels } from '../../models/investment.model';
import { AppDatePipe } from '../../pipes/app-date.pipe';

Chart.register(...registerables);

type Period = 'current_year' | 'previous_year' | 'last_5_years';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatButtonToggleModule,
    AppDatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  overallMetrics?: PerformanceMetrics;
  typeMetrics: Array<{ type: string; metrics: PerformanceMetrics }> = [];
  recentTransactions: Array<Transaction & { investmentName: string }> = [];
  baseCurrency = 'BRL';
  selectedPeriod: Period = 'current_year';
  chart?: Chart;

  displayedColumns: string[] = ['date', 'investment', 'type', 'amount'];

  constructor(
    private investmentService: InvestmentService,
    private profitabilityService: ProfitabilityService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.currencyService.getConfig().subscribe(config => {
      this.baseCurrency = config.baseCurrency;
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  private loadDashboardData(): void {
    // Load overall metrics
    this.overallMetrics = this.profitabilityService.calculateOverallPerformance(
      new Date(2000, 0, 1),
      new Date()
    );

    // Load metrics by type for selected period
    this.updateTypeMetrics();

    // Load recent transactions
    const { deposits, withdrawals } = this.profitabilityService.getCurrentYearTransactions();
    const allTransactions = [...deposits, ...withdrawals]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    this.recentTransactions = allTransactions.map(t => {
      const investment = this.investmentService.getInvestment(t.investmentId);
      return {
        ...t,
        investmentName: investment?.name || 'Unknown'
      };
    });
  }

  private getPeriodDates(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (this.selectedPeriod) {
      case 'current_year':
        return {
          startDate: new Date(currentYear, 0, 1),
          endDate: now
        };
      case 'previous_year':
        return {
          startDate: new Date(currentYear - 1, 0, 1),
          endDate: new Date(currentYear - 1, 11, 31)
        };
      case 'last_5_years':
        return {
          startDate: new Date(currentYear - 5, 0, 1),
          endDate: now
        };
    }
  }

  private updateTypeMetrics(): void {
    const { startDate, endDate } = this.getPeriodDates();
    const metricsByType = new Map<string, PerformanceMetrics>();

    this.investmentService.getInvestments().subscribe(investments => {
      investments.forEach(investment => {
        const metrics = this.profitabilityService.calculatePerformance(
          investment.id,
          startDate,
          endDate
        );

        const typeLabel = InvestmentTypeLabels[investment.type as keyof typeof InvestmentTypeLabels] || investment.type;
        const existing = metricsByType.get(typeLabel);

        if (existing) {
          existing.totalInvested += metrics.totalInvested;
          existing.currentBalance += metrics.currentBalance;
          existing.totalReturn += metrics.totalReturn;
          existing.returnPercentage = existing.totalInvested > 0
            ? (existing.totalReturn / existing.totalInvested) * 100
            : 0;
        } else {
          metricsByType.set(typeLabel, { ...metrics });
        }
      });

      this.typeMetrics = Array.from(metricsByType.entries()).map(([type, metrics]) => ({
        type,
        metrics
      }));

      // Update chart if it exists
      if (this.chart) {
        this.updateChart();
      }
    });
  }

  onPeriodChange(): void {
    this.updateTypeMetrics();
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.typeMetrics.map(tm => tm.type);
    const data = this.typeMetrics.map(tm => tm.metrics.returnPercentage);
    const backgroundColors = [
      'rgba(63, 81, 181, 0.8)',   // Indigo
      'rgba(233, 30, 99, 0.8)',   // Pink
      'rgba(0, 150, 136, 0.8)',   // Teal
      'rgba(255, 152, 0, 0.8)',   // Orange
      'rgba(156, 39, 176, 0.8)',  // Purple
      'rgba(76, 175, 80, 0.8)'    // Green
    ];

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Rentabilidade (%)',
          data,
          backgroundColor: backgroundColors.slice(0, data.length),
          borderColor: backgroundColors.slice(0, data.length).map(c => c.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y as number;
                return `Rentabilidade: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    const labels = this.typeMetrics.map(tm => tm.type);
    const data = this.typeMetrics.map(tm => tm.metrics.returnPercentage);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  getTransactionTypeLabel(type: TransactionType): string {
    switch (type) {
      case TransactionType.DEPOSIT:
        return 'Aporte';
      case TransactionType.WITHDRAWAL:
        return 'Saque';
      case TransactionType.BALANCE_UPDATE:
        return 'Atualização';
      default:
        return type;
    }
  }

  getTransactionTypeColor(type: TransactionType): string {
    switch (type) {
      case TransactionType.DEPOSIT:
        return 'primary';
      case TransactionType.WITHDRAWAL:
        return 'warn';
      default:
        return 'accent';
    }
  }

  formatCurrency(amount: number): string {
    return this.currencyService.formatCurrency(amount, this.baseCurrency as any);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
}
