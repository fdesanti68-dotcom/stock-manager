import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { CurrencyService } from '../services/currency.service';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  constructor(private currencyService: CurrencyService) {
    super('pt-BR');
  }

  override parse(value: any): Date | null {
    if (!value) {
      return null;
    }

    const dateFormat = this.currencyService.getDateFormat();

    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        let day: number, month: number, year: number;

        if (dateFormat === 'dd/MM/yyyy') {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          year = parseInt(parts[2], 10);
        } else {
          // MM/dd/yyyy
          month = parseInt(parts[0], 10) - 1;
          day = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }

        return new Date(year, month, day);
      }
    }

    return super.parse(value);
  }

  override format(date: Date, displayFormat: Object): string {
    if (!date) {
      return '';
    }

    const dateFormat = this.currencyService.getDateFormat();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (dateFormat === 'MM/dd/yyyy') {
      return `${month}/${day}/${year}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  }
}
