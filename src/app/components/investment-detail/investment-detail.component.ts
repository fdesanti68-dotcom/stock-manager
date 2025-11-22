import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { InvestmentService } from '../../services/investment.service';
import { ProfitabilityService } from '../../services/profitability.service';
import { CurrencyService } from '../../services/currency.service';
import { Investment, Transaction, TransactionType, InvestmentTypeLabels } from '../../models/investment.model';
import { AppDatePipe } from '../../pipes/app-date.pipe';

Chart.register(...registerables);

type ChartPeriod = 'current_year' | 'previous_year' | 'last_5_years' | 'since_start';

@Component({
  selector: 'app-investment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    AppDatePipe
  ],
  templateUrl: './investment-detail.component.html',
  styleUrls: ['./investment-detail.component.scss']
})
export class InvestmentDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('performanceChart') performanceChart!: ElementRef<HTMLCanvasElement>;

  investment?: Investment;
  transactions: Transaction[] = [];
  displayedColumns: string[] = ['date', 'type', 'amount', 'balance', 'actions'];
  baseCurrency = 'BRL';

  // Chart properties
  chart?: Chart;
  selectedChartPeriod: ChartPeriod = 'since_start';
  showCDI = false;
  showIBOVESPA = false;
  showDOLLAR = false;

  // For adding new transactions
  newTransaction: {
    date: Date;
    type: TransactionType;
    amount: number;
    balance?: number;
    description?: string;
  } = {
    date: new Date(),
    type: TransactionType.DEPOSIT,
    amount: 0
  };

  TransactionType = TransactionType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private investmentService: InvestmentService,
    private profitabilityService: ProfitabilityService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvestment(id);
    }

    this.currencyService.getConfig().subscribe(config => {
      this.baseCurrency = config.baseCurrency;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.createPerformanceChart(), 100);
  }

  private loadInvestment(id: string): void {
    this.investment = this.investmentService.getInvestment(id);
    if (!this.investment) {
      this.router.navigate(['/investments']);
      return;
    }

    this.loadTransactions();
  }

  private loadTransactions(): void {
    if (!this.investment) return;

    this.transactions = this.investmentService.getInvestmentTransactions(this.investment.id);
  }

  getCurrentBalance(): number {
    if (!this.investment) return 0;
    return this.investmentService.getCurrentBalance(this.investment.id);
  }

  getProfitability(): number {
    if (!this.investment) return 0;
    const metrics = this.profitabilityService.calculatePerformance(
      this.investment.id,
      new Date(this.investment.startDate),
      new Date()
    );
    return metrics.returnPercentage;
  }

  getTotalInvested(): number {
    if (!this.investment) return 0;
    const metrics = this.profitabilityService.calculatePerformance(
      this.investment.id,
      new Date(this.investment.startDate),
      new Date()
    );
    return metrics.totalInvested;
  }

  getTotalReturn(): number {
    if (!this.investment) return 0;
    const metrics = this.profitabilityService.calculatePerformance(
      this.investment.id,
      new Date(this.investment.startDate),
      new Date()
    );
    return metrics.totalReturn;
  }

  addTransaction(): void {
    if (!this.investment) return;

    if (this.newTransaction.type === TransactionType.BALANCE_UPDATE && !this.newTransaction.balance) {
      alert('Por favor, informe o novo saldo.');
      return;
    }

    if (this.newTransaction.amount <= 0 && this.newTransaction.type !== TransactionType.BALANCE_UPDATE) {
      alert('Por favor, informe um valor válido.');
      return;
    }

    this.investmentService.addTransaction({
      investmentId: this.investment.id,
      date: this.newTransaction.date,
      type: this.newTransaction.type,
      amount: this.newTransaction.amount,
      balance: this.newTransaction.balance,
      description: this.newTransaction.description
    });

    // Reset form
    this.newTransaction = {
      date: new Date(),
      type: TransactionType.DEPOSIT,
      amount: 0
    };

    this.loadTransactions();
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      this.investmentService.deleteTransaction(transaction.id);
      this.loadTransactions();
    }
  }

  getRunningBalance(transaction: Transaction): number {
    if (!this.investment) return 0;

    const allTransactions = this.investmentService.getInvestmentTransactions(this.investment.id);
    const index = allTransactions.findIndex(t => t.id === transaction.id);

    let balance = this.investment.initialValue;
    for (let i = 0; i <= index; i++) {
      const t = allTransactions[i];
      switch (t.type) {
        case TransactionType.DEPOSIT:
          balance += t.amount;
          break;
        case TransactionType.WITHDRAWAL:
          balance -= t.amount;
          break;
        case TransactionType.BALANCE_UPDATE:
          balance = t.balance || balance;
          break;
      }
    }

    return balance;
  }

  formatCurrency(amount: number): string {
    return this.currencyService.formatCurrency(amount, this.investment?.currency || this.baseCurrency as any);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  getTypeLabel(): string {
    if (!this.investment) return '';
    return InvestmentTypeLabels[this.investment.type] || this.investment.type;
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

  private getChartPeriodDates(): { startDate: Date; endDate: Date } {
    if (!this.investment) {
      return { startDate: new Date(), endDate: new Date() };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const investmentStart = new Date(this.investment.startDate);

    switch (this.selectedChartPeriod) {
      case 'current_year':
        return {
          startDate: new Date(Math.max(new Date(currentYear, 0, 1).getTime(), investmentStart.getTime())),
          endDate: now
        };
      case 'previous_year':
        return {
          startDate: new Date(Math.max(new Date(currentYear - 1, 0, 1).getTime(), investmentStart.getTime())),
          endDate: new Date(currentYear - 1, 11, 31)
        };
      case 'last_5_years':
        return {
          startDate: new Date(Math.max(new Date(currentYear - 5, 0, 1).getTime(), investmentStart.getTime())),
          endDate: now
        };
      case 'since_start':
      default:
        return {
          startDate: investmentStart,
          endDate: now
        };
    }
  }

  onChartPeriodChange(): void {
    this.updatePerformanceChart();
  }

  onBenchmarkChange(): void {
    this.updatePerformanceChart();
  }

  private createPerformanceChart(): void {
    if (!this.performanceChart || !this.investment) return;

    const ctx = this.performanceChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Populate historical benchmark data if needed
    const { startDate, endDate } = this.getChartPeriodDates();
    this.currencyService.populateHistoricalBenchmarkData(startDate, endDate);

    const { labels, investmentData, cdiData, ibovespaData, dollarData } = this.getChartData();

    const datasets: any[] = [
      {
        label: this.investment.name,
        data: investmentData,
        borderColor: 'rgba(63, 81, 181, 1)',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ];

    if (this.showCDI && cdiData.length > 0) {
      datasets.push({
        label: 'CDI',
        data: cdiData,
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    }

    if (this.showIBOVESPA && ibovespaData.length > 0) {
      datasets.push({
        label: 'IBOVESPA',
        data: ibovespaData,
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    }

    if (this.showDOLLAR && dollarData.length > 0) {
      datasets.push({
        label: 'Dólar',
        data: dollarData,
        borderColor: 'rgba(233, 30, 99, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
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

  private updatePerformanceChart(): void {
    if (!this.chart) return;

    const { labels, investmentData, cdiData, ibovespaData, dollarData } = this.getChartData();

    this.chart.data.labels = labels;

    // Update investment data
    this.chart.data.datasets[0].data = investmentData;

    // Remove all benchmark datasets
    this.chart.data.datasets = this.chart.data.datasets.slice(0, 1);

    // Add selected benchmarks
    if (this.showCDI && cdiData.length > 0) {
      this.chart.data.datasets.push({
        label: 'CDI',
        data: cdiData,
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    }

    if (this.showIBOVESPA && ibovespaData.length > 0) {
      this.chart.data.datasets.push({
        label: 'IBOVESPA',
        data: ibovespaData,
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    }

    if (this.showDOLLAR && dollarData.length > 0) {
      this.chart.data.datasets.push({
        label: 'Dólar',
        data: dollarData,
        borderColor: 'rgba(233, 30, 99, 1)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    }

    this.chart.update();
  }

  private getChartData(): {
    labels: string[],
    investmentData: number[],
    cdiData: number[],
    ibovespaData: number[],
    dollarData: number[]
  } {
    if (!this.investment) {
      return { labels: [], investmentData: [], cdiData: [], ibovespaData: [], dollarData: [] };
    }

    const { startDate, endDate } = this.getChartPeriodDates();
    const transactions = this.investmentService.getInvestmentTransactions(this.investment.id)
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (transactions.length === 0) {
      return { labels: [], investmentData: [], cdiData: [], ibovespaData: [], dollarData: [] };
    }

    const labels: string[] = [];
    const investmentData: number[] = [];
    const cdiData: number[] = [];
    const ibovespaData: number[] = [];
    const dollarData: number[] = [];

    let balance = this.investment.initialValue;
    const initialInvestment = this.investment.initialValue;

    // Get initial benchmark values for percentage calculation
    const initialBenchmarkData = this.currencyService.getBenchmarkData(new Date(this.investment.startDate));
    const initialCDI = initialBenchmarkData.CDI || 13.75;
    const initialIbovespa = initialBenchmarkData.IBOVESPA || 120000;
    const initialDollar = initialBenchmarkData.DOLLAR || 5.0;

    // Add initial point
    labels.push(new Date(this.investment.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
    investmentData.push(0);
    cdiData.push(0);
    ibovespaData.push(0);
    dollarData.push(0);

    transactions.forEach(transaction => {
      const tDate = new Date(transaction.date);

      switch (transaction.type) {
        case TransactionType.DEPOSIT:
          balance += transaction.amount;
          break;
        case TransactionType.WITHDRAWAL:
          balance -= transaction.amount;
          break;
        case TransactionType.BALANCE_UPDATE:
          balance = transaction.balance || balance;
          break;
      }

      const returnPercentage = initialInvestment > 0
        ? ((balance - initialInvestment) / initialInvestment) * 100
        : 0;

      labels.push(tDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
      investmentData.push(returnPercentage);

      // Get benchmark data and calculate percentage returns
      const benchmarkData = this.currencyService.getBenchmarkData(tDate);

      // CDI is typically an annual rate, so we need to calculate accumulated return
      // For simplicity, we're showing the rate value itself
      const cdiReturn = ((benchmarkData.CDI - initialCDI) / initialCDI) * 100;

      // IBOVESPA and Dollar are shown as percentage change from initial value
      const ibovespaReturn = ((benchmarkData.IBOVESPA - initialIbovespa) / initialIbovespa) * 100;
      const dollarReturn = ((benchmarkData.DOLLAR - initialDollar) / initialDollar) * 100;

      cdiData.push(cdiReturn);
      ibovespaData.push(ibovespaReturn);
      dollarData.push(dollarReturn);
    });

    return { labels, investmentData, cdiData, ibovespaData, dollarData };
  }
}
