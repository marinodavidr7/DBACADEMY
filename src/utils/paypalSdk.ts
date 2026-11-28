import type { CurrencyCode } from '../types';

export type PayPalButtonsInstance = {
  render: (container: HTMLElement | string) => Promise<void>;
  close?: () => Promise<void>;
  isEligible?: () => boolean;
};

export type PayPalNs = {
  Buttons: (options: Record<string, unknown>) => PayPalButtonsInstance;
};

export const getPayPalCurrency = (currency: CurrencyCode): string =>
  currency === 'DOP' ? 'USD' : currency;

export const getPayPalValue = (amountCents: number, currency: CurrencyCode): string => {
  const rate = Number(import.meta.env.VITE_DOP_TO_USD_RATE) || 60;
  const amount = currency === 'DOP' ? amountCents / 100 / rate : amountCents / 100;
  return amount.toFixed(2);
};

export const getPayPal = (): PayPalNs | undefined =>
  (window as unknown as { paypal?: PayPalNs }).paypal;

export const loadPayPalSdk = (
  clientId: string,
  currency: string,
  scriptId = 'dba-paypal-sdk'
): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (
    existing &&
    existing.dataset.loaded === 'true' &&
    existing.dataset.currency === currency &&
    getPayPal()?.Buttons
  ) {
    return Promise.resolve();
  }
  if (existing) existing.remove();
  if (getPayPal() && !getPayPal()?.Buttons) {
    delete (window as unknown as { paypal?: unknown }).paypal;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = scriptId;
    s.src = src;
    s.async = true;
    s.dataset.currency = currency;
    s.onload = () => {
      s.dataset.loaded = 'true';
      resolve();
    };
    s.onerror = () => reject(new Error('No se pudo cargar PayPal.'));
    document.body.appendChild(s);
  });
};
