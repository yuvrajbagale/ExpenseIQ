import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'eiqCurrency', standalone: true })
export class EiqCurrencyPipe implements PipeTransform {
  transform(value: number, showSign = true): string {
    const abs = Math.abs(value);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(abs);

    if (!showSign) return formatted;
    return value < 0 ? `-${formatted}` : `+${formatted}`;
  }
}
