import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../services/currency.service';
import { DateFormat } from '../models/config.model';

@Pipe({
  name: 'appDate',
  standalone: true,
  pure: false // Make it impure so it updates when config changes
})
export class AppDatePipe implements PipeTransform {
  constructor(private currencyService: CurrencyService) {}

  transform(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return '';
    }

    const format = this.currencyService.getDateFormat();
    return this.formatDate(date, format);
  }

  private formatDate(date: Date, format: DateFormat): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (format === 'MM/dd/yyyy') {
      return `${month}/${day}/${year}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  }
}
