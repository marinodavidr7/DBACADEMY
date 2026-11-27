import React, { useEffect, useRef, useState } from 'react';
import type { Course } from '../types';

declare global {
  interface Window {
    paypal?: {
      FUNDING?: {
        PAYPAL?: string;
        CARD?: string;
      };
      Buttons: (options: Record<string, unknown>) => {
        render: (container: HTMLElement | string) => Promise<void>;
        close?: () => Promise<void>;
        isEligible?: () => boolean;
      };
    };
  }
}

interface PayPalStatusResponse {
  clientId?: string;
  configured?: boolean;
}

interface PayPalButtonsBoxProps {
  course: Course;
  finalPriceCents: number;
  acceptedTerms: boolean;
  disabled?: boolean;
  onTermsRequired: () => void;
  onApproved: (payload: { orderId: string; captureId: string }) => Promise<void>;
  onError: (message: string) => void;
}

const SDK_SCRIPT_ID = 'dba-paypal-js-sdk';
const SDK_SCRIPT_SRC_BASE = 'https://www.paypal.com/sdk/js';
const SDK_FUNDING = 'card';

const getPayPalCurrency = (currency: Course['currency']): string => {
  if (currency === 'DOP') return 'USD';
  return currency;
};

const getPayPalValue = (finalPriceCents: number, currency: Course['currency']): string => {
  const rate = Number(import.meta.env.VITE_DOP_TO_USD_RATE) || 60;
  const amount = currency === 'DOP' ? finalPriceCents / 100 / rate : finalPriceCents / 100;
  return amount.toFixed(2);
};

const getPayPalClientId = (): string =>
  ((import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() || '');

const fetchPayPalClientId = async (): Promise<string> => {
  try {
    const res = await fetch('/api/v1/payments/paypal/status');
    if (!res.ok) return '';
    const data = (await res.json()) as PayPalStatusResponse;
    return typeof data.clientId === 'string' ? data.clientId.trim() : '';
  } catch {
    return '';
  }
};

const buildSdkSrc = (clientId: string, currency: string): string =>
  `${SDK_SCRIPT_SRC_BASE}?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&locale=es_DO&enable-funding=${SDK_FUNDING}&components=buttons`;

const loadPayPalSdk = (clientId: string, currency: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));

  const src = buildSdkSrc(clientId, currency);
  const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;

  if (existing) {
    const existingCurrency = existing.dataset.currency;
    const currencyMatches = !existingCurrency || existingCurrency === currency;
    const srcMatches = existing.src === src;
    if (currencyMatches && srcMatches && existing.dataset.loaded === 'true' && window.paypal?.Buttons) {
      return Promise.resolve();
    }
    if (currencyMatches && srcMatches) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar PayPal.')), {
          once: true,
        });
      });
    }
    existing.remove();
    delete window.paypal;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SDK_SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.dataset.currency = currency;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('No se pudo cargar PayPal.'));
    };
    document.body.appendChild(script);
  });
};

export const PayPalButtonsBox: React.FC<PayPalButtonsBoxProps> = ({
  course,
  finalPriceCents,
  acceptedTerms,
  disabled = false,
  onTermsRequired,
  onApproved,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<Array<{ close?: () => Promise<void> }>>([]);
  const acceptedTermsRef = useRef(acceptedTerms);
  const onTermsRequiredRef = useRef(onTermsRequired);
  const onApprovedRef = useRef(onApproved);
  const onErrorRef = useRef(onError);
  const courseRef = useRef(course);

  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  acceptedTermsRef.current = acceptedTerms;
  onTermsRequiredRef.current = onTermsRequired;
  onApprovedRef.current = onApproved;
  onErrorRef.current = onError;
  courseRef.current = course;

  const currency = getPayPalCurrency(course.currency);
  const value = getPayPalValue(finalPriceCents, course.currency);
  const rate = Number(import.meta.env.VITE_DOP_TO_USD_RATE) || 60;
  const showUsdEquivalent = course.currency === 'DOP';

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      setLoading(true);
      setLoadError('');
      setSdkReady(false);

      let clientId = getPayPalClientId();
      if (!clientId) {
        clientId = await fetchPayPalClientId();
      }

      if (cancelled) return;

      if (!clientId) {
        setLoading(false);
        setLoadError('PayPal no está configurado en este momento.');
        return;
      }

      try {
        await loadPayPalSdk(clientId, currency);
        if (cancelled) return;
        setSdkReady(true);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'No se pudo cargar PayPal.';
        setLoadError(message);
        setLoading(false);
        onErrorRef.current(message);
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [currency]);

  useEffect(() => {
    if (!sdkReady || !containerRef.current || !window.paypal?.Buttons) return;

    let cancelled = false;
    const container = containerRef.current;
    container.innerHTML = '';

    const closeButtons = () => {
      for (const btn of buttonsRef.current) {
        if (btn?.close) void btn.close().catch(() => undefined);
      }
      buttonsRef.current = [];
    };

    const baseOptions = {
      onClick: (_data: unknown, actions: { reject: () => unknown; resolve: () => unknown }) => {
        if (!acceptedTermsRef.current) {
          onTermsRequiredRef.current();
          return actions.reject();
        }
        return actions.resolve();
      },
      createOrder: (_data: unknown, actions: { order: { create: (payload: unknown) => Promise<string> } }) =>
        actions.order.create({
          application_context: {
            shipping_preference: 'NO_SHIPPING',
          },
          purchase_units: [
            {
              description: courseRef.current.title.slice(0, 127),
              custom_id: courseRef.current.id.slice(0, 127),
              amount: {
                currency_code: currency,
                value,
              },
            },
          ],
        }),
      onApprove: async (data: { orderID: string }, actions: { order: { capture: () => Promise<unknown> } }) => {
        try {
          const details = (await actions.order.capture()) as {
            purchase_units?: Array<{
              payments?: {
                captures?: Array<{ id?: string }>;
              };
            }>;
          };
          const captureId =
            details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.orderID;
          await onApprovedRef.current({ orderId: data.orderID, captureId });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'No se pudo confirmar el pago con PayPal.';
          onErrorRef.current(message);
        }
      },
      onError: (err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Ocurrió un error con PayPal. Intenta de nuevo.';
        onErrorRef.current(message);
      },
    };

    const fundingSources: Array<{ source: string | undefined; style: Record<string, unknown> }> = [
      {
        source: window.paypal.FUNDING?.CARD,
        style: { shape: 'rect', height: 50, color: 'black', label: 'pay' },
      },
      {
        source: window.paypal.FUNDING?.PAYPAL,
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 50 },
      },
    ];

    const rendered: Array<Promise<void>> = [];
    for (const { source, style } of fundingSources) {
      if (!source) continue;
      const btn = window.paypal.Buttons({
        ...baseOptions,
        fundingSource: source,
        style,
      });
      if (btn.isEligible && !btn.isEligible()) continue;

      const wrapper = document.createElement('div');
      container.appendChild(wrapper);
      buttonsRef.current.push(btn);
      rendered.push(btn.render(wrapper));
    }

    if (rendered.length === 0) {
      setLoadError('PayPal/Tarjeta no está disponible para este navegador o región.');
      return () => {
        cancelled = true;
        closeButtons();
      };
    }

    void Promise.allSettled(rendered).then((results) => {
      if (cancelled) return;
      const hasOk = results.some((r) => r.status === 'fulfilled');
      if (!hasOk) {
        const firstErr = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
        const message =
          firstErr && firstErr.reason instanceof Error
            ? firstErr.reason.message
            : 'No se pudo renderizar el botón de pago.';
        setLoadError(message);
        onErrorRef.current(message);
      }
    });

    return () => {
      cancelled = true;
      container.innerHTML = '';
      closeButtons();
    };
  }, [sdkReady, currency, value, course.id, course.title]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-[12px] bg-white dark:bg-zinc-950 p-1 min-h-[58px]">
        <div ref={containerRef} className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`} />

        {loading && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-500 dark:text-zinc-400">
            Cargando opciones de pago...
          </div>
        )}

        {!loading && sdkReady && !acceptedTerms && !loadError && (
          <button
            type="button"
            aria-label="Aceptar términos para continuar con el pago"
            onClick={() => onTermsRequiredRef.current()}
            className="absolute inset-0 z-10 rounded-[12px] bg-transparent cursor-pointer"
          />
        )}
      </div>

      {showUsdEquivalent && !loadError && (
        <p className="text-xs text-stone-500 dark:text-zinc-400 text-center">
          Total en PayPal: ${value} USD (tasa ref. 1 USD = RD${rate})
        </p>
      )}

      {loadError && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{loadError}</p>
      )}
    </div>
  );
};
