import type { CurrencyCode } from '../types';

export function normalizeCurrency(raw: unknown, fallback: CurrencyCode = 'DOP'): CurrencyCode {
  if (raw === 'DOP' || raw === 'USD' || raw === 'EUR' || raw === 'MXN') {
    return raw;
  }
  return fallback;
}

export function formatCurrency(cents: number, currency: CurrencyCode = 'DOP'): string {
  const safeAmount = Number.isFinite(cents) ? cents / 100 : 0;
  if (currency === 'DOP') {
    const num = new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
    return `RD$${num}`;
  }
  const locale = currency === 'MXN' ? 'es-MX' : currency === 'EUR' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(safeAmount);
}

export function currencyLabel(currency: CurrencyCode): string {
  switch (currency) {
    case 'DOP':
      return 'DOP (RD$ · Peso Dominicano)';
    case 'USD':
      return 'USD ($ · Dólar)';
    case 'EUR':
      return 'EUR (€ · Euro)';
    case 'MXN':
      return 'MXN ($ · Peso Mexicano)';
  }
}
