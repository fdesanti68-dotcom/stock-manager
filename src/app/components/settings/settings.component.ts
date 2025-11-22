import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { CurrencyService } from '../../services/currency.service';
import { BackupService } from '../../services/backup.service';
import { InstitutionService } from '../../services/institution.service';
import { Currency } from '../../models/investment.model';
import { Institution, InstitutionType, InstitutionTypeLabels } from '../../models/institution.model';
import { DateFormat, NumberFormat } from '../../models/config.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  baseCurrency: Currency = Currency.BRL;
  dateFormat: DateFormat = 'dd/MM/yyyy';
  numberFormat: NumberFormat = 'pt-BR';
  backupPassword = '';
  restorePassword = '';
  selectedFile: File | null = null;

  // Institutions
  institutions: Institution[] = [];
  newInstitution = {
    name: '',
    type: InstitutionType.BANK
  };
  InstitutionType = InstitutionType;
  displayedColumns: string[] = ['name', 'type', 'actions'];

  currencies = [
    { value: Currency.BRL, label: 'Real (R$)' },
    { value: Currency.USD, label: 'Dólar (US$)' },
    { value: Currency.EUR, label: 'Euro (€)' }
  ];

  dateFormats = [
    { value: 'dd/MM/yyyy' as DateFormat, label: 'dd/MM/yyyy (Brasileiro)' },
    { value: 'MM/dd/yyyy' as DateFormat, label: 'MM/dd/yyyy (Americano)' }
  ];

  numberFormats = [
    { value: 'pt-BR' as NumberFormat, label: '9.999,99 (Brasileiro)' },
    { value: 'en-US' as NumberFormat, label: '9,999.99 (Americano)' }
  ];

  institutionTypes = [
    { value: InstitutionType.BANK, label: 'Banco' },
    { value: InstitutionType.BROKER, label: 'Corretora' }
  ];

  constructor(
    private currencyService: CurrencyService,
    private backupService: BackupService,
    private institutionService: InstitutionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currencyService.getConfig().subscribe(config => {
      this.baseCurrency = config.baseCurrency;
      this.dateFormat = config.dateFormat;
      this.numberFormat = config.numberFormat;
    });

    this.loadInstitutions();
  }

  private loadInstitutions(): void {
    this.institutionService.getInstitutions().subscribe(institutions => {
      this.institutions = institutions;
    });
  }

  addInstitution(): void {
    if (!this.newInstitution.name.trim()) {
      this.snackBar.open('Por favor, informe o nome da instituição.', 'OK', { duration: 3000 });
      return;
    }

    this.institutionService.createInstitution(this.newInstitution);
    this.newInstitution = {
      name: '',
      type: InstitutionType.BANK
    };
    this.snackBar.open('Instituição adicionada com sucesso!', 'OK', { duration: 3000 });
  }

  deleteInstitution(institution: Institution): void {
    if (confirm(`Tem certeza que deseja excluir "${institution.name}"?`)) {
      this.institutionService.deleteInstitution(institution.id);
      this.snackBar.open('Instituição excluída com sucesso!', 'OK', { duration: 3000 });
    }
  }

  getInstitutionTypeLabel(type: InstitutionType): string {
    return InstitutionTypeLabels[type];
  }

  onCurrencyChange(): void {
    this.currencyService.setBaseCurrency(this.baseCurrency);
    this.snackBar.open('Moeda base atualizada!', 'OK', { duration: 3000 });
  }

  onDateFormatChange(): void {
    this.currencyService.setDateFormat(this.dateFormat);
    this.snackBar.open('Formato de data atualizado!', 'OK', { duration: 3000 });
  }

  onNumberFormatChange(): void {
    this.currencyService.setNumberFormat(this.numberFormat);
    this.snackBar.open('Formato de número atualizado!', 'OK', { duration: 3000 });
  }

  async exportBackup(): Promise<void> {
    if (!this.backupPassword) {
      this.snackBar.open('Por favor, defina uma senha para o backup.', 'OK', { duration: 3000 });
      return;
    }

    if (this.backupPassword.length < 6) {
      this.snackBar.open('A senha deve ter pelo menos 6 caracteres.', 'OK', { duration: 3000 });
      return;
    }

    try {
      const blob = await this.backupService.createBackup(this.backupPassword);
      this.backupService.downloadBackup(blob);
      this.snackBar.open('Backup exportado com sucesso!', 'OK', { duration: 3000 });
      this.backupPassword = '';
    } catch (error) {
      console.error('Export backup error:', error);
      this.snackBar.open('Erro ao exportar backup.', 'OK', { duration: 3000 });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  async importBackup(): Promise<void> {
    if (!this.selectedFile) {
      this.snackBar.open('Por favor, selecione um arquivo de backup.', 'OK', { duration: 3000 });
      return;
    }

    if (!this.restorePassword) {
      this.snackBar.open('Por favor, informe a senha do backup.', 'OK', { duration: 3000 });
      return;
    }

    try {
      const success = await this.backupService.restoreBackup(this.selectedFile, this.restorePassword);
      if (success) {
        this.snackBar.open('Backup restaurado com sucesso!', 'OK', { duration: 3000 });
        this.restorePassword = '';
        this.selectedFile = null;
        // Reset file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (error: any) {
      console.error('Import backup error:', error);
      this.snackBar.open(error.message || 'Erro ao restaurar backup.', 'OK', { duration: 5000 });
    }
  }
}
