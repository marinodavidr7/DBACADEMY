import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import type { Course } from '../types';

declare global {
  interface Window {
    paypal?: {
      FUNDING?: {
        PAYPAL?: string;
        CARD?: string;
        [key: string]: string | undefined;
      };
      Buttons: (options: {
        fundingSource?: string;
        style?: {
          layout?: 'vertical' | 'horizontal';
          color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
          shape?: 'rect' | 'pill';
          label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
          height?: number;
        };
        onClick?: (
          data: Record<string, unknown>,
          actions: { resolve: () => Promise<void>; reject: () => Promise<void> }
        ) => Promise<void> | void;
        createOrder: (
          data: Record<string, unknown>,
          actions: {
            order: {
              create: (payload: Record<string, unknown>) => Promise<string>;
            };
          }
        ) => Promise<string>;
        onApprove: (
          data: { orderID: string },
          actions: {
            order: {
              capture: () => Promise<{
                id?: string;
                status?: string;
                purchase_units?: Array<{
                  payments?: {
                    captures?: Array<{ id?: string; status?: string }>;
                  };
                }>;
              }>;
            };
          }
        ) => Promise<void>;
        onCancel?: () => void;
        onError?: (err: unknown) => void;
      }) => {
        render: (container: HTMLElement) => Promise<void>;
        close?: () => Promise<void>;
        isEligible?: () => boolean;
      };
    };
  }
}

interface PayPalButtonsBoxProps {
  course: Course;
  finalPriceCents: number;
  acceptedTerms: boolean;
  disabled?: boolean;
  method?: 'paypal' | 'card';
  onTermsRequired: () => void;
  onApproved: (payload: { orderId: string; captureId: string }) => Promise<void>;
  onError: (message: string) => void;
}

const DEFAULT_DOP_TO_USD_RATE = 60;

/** Convierte el monto del curso a una moneda soportada por PayPal JS SDK. */
export function resolvePayPalAmount(
  amountCents: number,
  currency: Course['currency']
): {
  paypalCurrency: 'USD' | 'EUR' | 'MXN';
  paypalAmount: string;
  convertedFromDop: boolean;
  dopRate: number;
} {
  const configuredRate = Number(import.meta.env.VITE_DOP_TO_USD_RATE);
  const dopRate =
    Number.isFinite(configuredRate) && configuredRate > 0
      ? configuredRate
      : DEFAULT_DOP_TO_USD_RATE;

  if (currency === 'USD' || currency === 'EUR' || currency === 'MXN') {
    return {
      paypalCurrency: currency,
      paypalAmount: Math.max(0.01, amountCents / 100).toFixed(2),
      convertedFromDop: false,
      dopRate,
    };
  }

  // PayPal Checkout no soporta DOP directamente; se convierte a USD.
  const usdValue = Math.max(0.01, amountCents / 100 / dopRate);
  return {
    paypalCurrency: 'USD',
    paypalAmount: usdValue.toFixed(2),
    convertedFromDop: true,
    dopRate,
  };
}

export const PayPalButtonsBox: React.FC<PayPalButtonsBoxProps> = ({
  course,
  finalPriceCents,
  acceptedTerms,
  disabled = false,
  method: _method = 'paypal',
  onTermsRequired,
  onApproved,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clientId, setClientId] = useState<string>(
    () => (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() || ''
  );
  const [sdkReady, setSdkReady] = useState(false);
  const [loadingSdk, setLoadingSdk] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [fundingUnavailable, setFundingUnavailable] = useState(false);

  const { paypalCurrency, paypalAmount, convertedFromDop, dopRate } = resolvePayPalAmount(
    finalPriceCents,
    course.currency
  );

  // Refs para evitar re-renderizar el botón cuando cambian términos o montos por cupón
  const acceptedTermsRef = useRef(acceptedTerms);
  acceptedTermsRef.current = acceptedTerms;
  const amountRef = useRef(paypalAmount);
  amountRef.current = paypalAmount;
  const currencyRef = useRef(paypalCurrency);
  currencyRef.current = paypalCurrency;
  const courseRef = useRef(course);
  courseRef.current = course;
  const onTermsRequiredRef = useRef(onTermsRequired);
  onTermsRequiredRef.current = onTermsRequired;
  const onApprovedRef = useRef(onApproved);
  onApprovedRef.current = onApproved;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Fallback: obtener Client ID público desde el backend si no vino embebido en Vite
  useEffect(() => {
    if (clientId) return;
    let active = true;
    void fetch('/api/v1/payments/paypal/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { clientId?: string } | null) => {
        if (active && data?.clientId) {
          setClientId(data.clientId.trim());
        } else if (active) {
          setLoadingSdk(false);
        }
      })
      .catch(() => {
        if (active) setLoadingSdk(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  // Cargar el SDK JS de PayPal sin duplicar scripts
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    const scriptId = 'dba-paypal-js-sdk';
    const expectedSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${encodeURIComponent(paypalCurrency)}&intent=capture&locale=es_DO`;

    const handleLoad = () => {
      if (!active) return;
      setSdkReady(Boolean(window.paypal?.Buttons));
      setLoadingSdk(false);
    };

    const handleError = () => {
      if (!active) return;
      setSdkReady(false);
      setLoadingSdk(false);
      onErrorRef.current(
        'No se pudo cargar la pasarela de PayPal. Verifica tu conexión o desactiva bloqueadores de scripts.'
      );
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing && existing.src === expectedSrc) {
      if (window.paypal?.Buttons) {
        setSdkReady(true);
        setLoadingSdk(false);
        return;
      }
      setLoadingSdk(true);
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return () => {
        active = false;
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
      };
    }

    if (existing && existing.src !== expectedSrc) {
      existing.remove();
      delete window.paypal;
    }

    setLoadingSdk(true);
    setSdkReady(false);

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = expectedSrc;
    script.async = true;
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    document.body.appendChild(script);

    return () => {
      active = false;
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [clientId, paypalCurrency]);

  // Renderizar botón inteligente de PayPal (solo funding PAYPAL)
  useEffect(() => {
    if (!sdkReady || !window.paypal?.Buttons || !containerRef.current || disabled) return;

    let cancelled = false;
    const container = containerRef.current;
    container.innerHTML = '';
    setFundingUnavailable(false);

    const paypalFunding = window.paypal.FUNDING?.PAYPAL;
    const buttons = window.paypal.Buttons({
      ...(paypalFunding ? { fundingSource: paypalFunding } : {}),
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 42,
      },
      onClick: (_data, actions) => {
        if (!acceptedTermsRef.current) {
          onTermsRequiredRef.current();
          return actions.reject();
        }
        return actions.resolve();
      },
      createOrder: (_data, actions) => {
        return actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              description: courseRef.current.title.slice(0, 127),
              custom_id: courseRef.current.id.slice(0, 127),
              amount: {
                currency_code: currencyRef.current,
                value: amountRef.current,
              },
            },
          ],
        });
      },
      onApprove: async (data, actions) => {
        setCapturing(true);
        try {
          const details = await actions.order.capture();
          const captureId =
            details?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
            details?.id ||
            data.orderID;
          await onApprovedRef.current({
            orderId: data.orderID,
            captureId,
          });
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'No se pudo completar el cobro en PayPal. Intenta nuevamente.';
          onErrorRef.current(msg);
        } finally {
          setCapturing(false);
        }
      },
      onCancel: () => {
        setCapturing(false);
      },
      onError: (err) => {
        setCapturing(false);
        console.error('[paypal] Error en SDK:', err);
        onErrorRef.current('Ocurrió un error al procesar el pago con PayPal.');
      },
    });

    if (buttons.isEligible && !buttons.isEligible()) {
      setFundingUnavailable(true);
      return;
    }

    void buttons.render(container).catch((err) => {
      if (!cancelled) {
        console.error('[paypal] Error renderizando botones:', err);
      }
    });

    return () => {
      cancelled = true;
      if (buttons.close) {
        void buttons.close().catch(() => {});
      }
      container.innerHTML = '';
    };
  }, [sdkReady, disabled]);

  if (!clientId && !loadingSdk) {
    return (
      <p className="text-xs text-red-600 dark:text-red-400">
        Falta configurar VITE_PAYPAL_CLIENT_ID para habilitar los botones de PayPal.
      </p>
    );
  }

  const isLocked = disabled || capturing || !acceptedTerms;

  return (
    <div className="w-full space-y-2.5">
      {convertedFromDop && (
        <p className="text-[11px] text-[var(--dba-text-secondary)]">
          Total a cobrar en PayPal:{' '}
          <strong className="text-[var(--dba-text-primary)]">${paypalAmount} USD</strong> (tasa
          referencial 1 USD = RD${dopRate}).
        </p>
      )}

      {(loadingSdk || capturing) && (
        <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-[var(--dba-text-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{capturing ? 'Confirmando pago e inscribiendo...' : 'Cargando PayPal...'}</span>
        </div>
      )}

      <div className="relative rounded-xl bg-white p-3 border border-stone-200 shadow-xs">
        <div
          ref={containerRef}
          className={isLocked ? 'opacity-45 pointer-events-none select-none' : ''}
        />

        {fundingUnavailable && !loadingSdk && (
          <p className="text-xs text-amber-700 dark:text-amber-300 py-2 text-center">
            Este método de pago no está disponible en este momento. Prueba el otro método.
          </p>
        )}

        {!acceptedTerms && !loadingSdk && !capturing && (
          <button
            type="button"
            onClick={() => onTermsRequiredRef.current()}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px] px-4 text-center cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-md">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Acepta los Términos y Condiciones arriba para habilitar el pago
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
