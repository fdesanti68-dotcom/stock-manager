import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InvestmentService } from '../../services/investment.service';
import { InstitutionService } from '../../services/institution.service';
import { ProfitabilityService } from '../../services/profitability.service';
import { CurrencyService } from '../../services/currency.service';
import { Investment, InvestmentType, Currency, InvestmentTypeLabels, InvestmentCategories } from '../../models/investment.model';
import { InvestmentFormDialogComponent } from './investment-form-dialog.component';

@Component({
  selector: 'app-investments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './investments-list.component.html',
  styleUrls: ['./investments-list.component.scss']
})
export class InvestmentsListComponent implements OnInit {
  investments: Investment[] = [];
  displayedColumns: string[] = ['name', 'institution', 'type', 'currentBalance', 'profitability', 'actions'];
  baseCurrency = 'BRL';

  constructor(
    private investmentService: InvestmentService,
    private institutionService: InstitutionService,
    private profitabilityService: ProfitabilityService,
    private currencyService: CurrencyService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInvestments();
    this.currencyService.getConfig().subscribe(config => {
      this.baseCurrency = config.baseCurrency;
    });
  }

  private loadInvestments(): void {
    this.investmentService.getInvestments().subscribe(investments => {
      this.investments = investments;
    });
  }

  getInvestmentBalance(investment: Investment): number {
    return this.investmentService.getCurrentBalance(investment.id);
  }

  getInvestmentBalanceInBaseCurrency(investment: Investment): number {
    const balance = this.getInvestmentBalance(investment);
    return this.currencyService.convertToBaseCurrency(balance, investment.currency);
  }

  getInvestmentProfitability(investment: Investment): number {
    const metrics = this.profitabilityService.calculatePerformance(
      investment.id,
      new Date(investment.startDate),
      new Date()
    );
    return metrics.returnPercentage;
  }

  formatCurrency(amount: number, currency?: Currency): string {
    const curr = currency || (this.baseCurrency as Currency);
    return this.currencyService.formatCurrency(amount, curr);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  getTypeLabel(type: InvestmentType): string {
    return InvestmentTypeLabels[type] || type;
  }

  getInstitutionName(institutionId?: string): string {
    if (!institutionId) return '-';
    const institution = this.institutionService.getInstitution(institutionId);
    return institution?.name || '-';
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(InvestmentFormDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInvestments();
      }
    });
  }

  openEditDialog(investment: Investment): void {
    const dialogRef = this.dialog.open(InvestmentFormDialogComponent, {
      width: '600px',
      data: investment
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInvestments();
      }
    });
  }

  deleteInvestment(investment: Investment): void {
    if (confirm(`Tem certeza que deseja excluir o investimento "${investment.name}"?`)) {
      this.investmentService.deleteInvestment(investment.id);
    }
  }
}
