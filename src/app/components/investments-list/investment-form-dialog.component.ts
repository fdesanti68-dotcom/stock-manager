import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InvestmentService } from '../../services/investment.service';
import { InstitutionService } from '../../services/institution.service';
import { Investment, InvestmentType, Currency, InvestmentCategories, InvestmentTypeLabels } from '../../models/investment.model';
import { Institution } from '../../models/institution.model';

@Component({
  selector: 'app-investment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Novo' }} Investimento</h2>
    <mat-dialog-content>
      <form #investmentForm="ngForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput [(ngModel)]="formData.name" name="name" required>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Categoria</mat-label>
          <mat-select [(ngModel)]="selectedCategory" name="category" (selectionChange)="onCategoryChange()" required>
            <mat-option *ngFor="let category of categories" [value]="category">
              {{ category }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width" *ngIf="selectedCategory">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="formData.type" name="type" required>
            <mat-option *ngFor="let type of getTypesForCategory()" [value]="type">
              {{ getTypeLabel(type) }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Banco/Corretora</mat-label>
          <mat-select [(ngModel)]="formData.institutionId" name="institutionId">
            <mat-option [value]="undefined">Nenhuma</mat-option>
            <mat-option *ngFor="let institution of institutions" [value]="institution.id">
              {{ institution.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Moeda</mat-label>
          <mat-select [(ngModel)]="formData.currency" name="currency" required>
            <mat-option value="BRL">Real (R$)</mat-option>
            <mat-option value="USD">Dólar (US$)</mat-option>
            <mat-option value="EUR">Euro (€)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Data de Início</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="formData.startDate" name="startDate" required>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Valor Inicial</mat-label>
          <input matInput type="number" [(ngModel)]="formData.initialValue" name="initialValue" required min="0" step="0.01">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Comentários</mat-label>
          <textarea matInput [(ngModel)]="formData.comments" name="comments" rows="3" placeholder="Observações sobre o investimento (opcional)"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!investmentForm.valid">
        {{ isEdit ? 'Salvar' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class InvestmentFormDialogComponent implements OnInit {
  isEdit = false;
  categories: string[] = [];
  selectedCategory: string = '';
  institutions: Institution[] = [];

  formData: {
    name: string;
    institutionId?: string;
    type: InvestmentType;
    currency: Currency;
    startDate: Date;
    initialValue: number;
    comments?: string;
  } = {
    name: '',
    institutionId: undefined,
    type: InvestmentType.CDB,
    currency: Currency.BRL,
    startDate: new Date(),
    initialValue: 0,
    comments: ''
  };

  constructor(
    private dialogRef: MatDialogRef<InvestmentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Investment | null,
    private investmentService: InvestmentService,
    private institutionService: InstitutionService
  ) {
    this.categories = Object.keys(InvestmentCategories);
  }

  ngOnInit(): void {
    // Load institutions
    this.institutionService.getInstitutions().subscribe(institutions => {
      this.institutions = institutions;
    });

    if (this.data) {
      this.isEdit = true;
      this.formData = {
        name: this.data.name,
        institutionId: this.data.institutionId,
        type: this.data.type,
        currency: this.data.currency,
        startDate: new Date(this.data.startDate),
        initialValue: this.data.initialValue,
        comments: this.data.comments || ''
      };

      // Find category for this type
      for (const [category, types] of Object.entries(InvestmentCategories)) {
        if (types.includes(this.data.type)) {
          this.selectedCategory = category;
          break;
        }
      }
    }
  }

  onCategoryChange(): void {
    // Reset type when category changes
    const types = this.getTypesForCategory();
    if (types.length > 0) {
      this.formData.type = types[0];
    }
  }

  getTypesForCategory(): InvestmentType[] {
    if (!this.selectedCategory) {
      return [];
    }
    return InvestmentCategories[this.selectedCategory as keyof typeof InvestmentCategories] || [];
  }

  getTypeLabel(type: InvestmentType): string {
    return InvestmentTypeLabels[type] || type;
  }

  onSave(): void {
    if (this.isEdit && this.data) {
      this.investmentService.updateInvestment(this.data.id, this.formData);
    } else {
      this.investmentService.createInvestment(this.formData);
    }
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
