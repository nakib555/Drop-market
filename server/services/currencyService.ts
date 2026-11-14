import type {
  CurrencyCode,
  CurrencyRateState,
  OrderCurrencySnapshot,
} from '../../src/types/commerce.ts';

const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

const INITIAL_BDT_RATE = Number(env.BDT_EXCHANGE_RATE) > 0 ? Number(env.BDT_EXCHANGE_RATE) : 120.5;
const INITIAL_SOURCE = env.FX_RATE_SOURCE || 'Bangladesh Bank & OpenFX Studio Reference Feed';
const INITIAL_FREQ = Number(env.FX_UPDATE_FREQUENCY_MIN) > 0 ? Number(env.FX_UPDATE_FREQUENCY_MIN) : 30;

export function createInitialCurrencyState(): CurrencyRateState {
  return {
    baseCurrency: 'USD',
    defaultCurrency: 'BDT',
    rates: {
      USD: 1,
      BDT: INITIAL_BDT_RATE,
    },
    source: INITIAL_SOURCE,
    updateFrequencyMinutes: INITIAL_FREQ,
    updatedAt: new Date().toISOString(),
    roundingRules: {
      BDT: { decimals: 0, mode: 'ceil_integer_taka' },
      USD: { decimals: 2, mode: 'half_even_cents' },
    },
  };
}

export function roundCurrencyAmount(amount: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amount)) return 0;
  if (currency === 'BDT') {
    return Math.ceil(amount);
  }
  return Math.round(amount * 100) / 100;
}

export function convertUsdToCurrency(
  amountUsd: number,
  targetCurrency: CurrencyCode,
  state: CurrencyRateState
): number {
  if (targetCurrency === 'USD') {
    return roundCurrencyAmount(amountUsd, 'USD');
  }
  const rate = state.rates[targetCurrency] || INITIAL_BDT_RATE;
  return roundCurrencyAmount(amountUsd * rate, targetCurrency);
}

export function buildOrderCurrencySnapshot(
  baseSubtotalUsd: number,
  baseTotalUsd: number,
  targetCurrency: CurrencyCode,
  state: CurrencyRateState
): OrderCurrencySnapshot {
  const rate = targetCurrency === 'USD' ? 1 : state.rates[targetCurrency] || INITIAL_BDT_RATE;
  const roundingRule = state.roundingRules[targetCurrency]?.mode || 'half_even_cents';
  const chargedTotal = convertUsdToCurrency(baseTotalUsd, targetCurrency, state);

  return {
    baseCurrency: 'USD',
    transactionCurrency: targetCurrency,
    exchangeRate: rate,
    rateSource: state.source,
    rateTimestamp: state.updatedAt,
    roundingRule,
    baseSubtotalUsd: roundCurrencyAmount(baseSubtotalUsd, 'USD'),
    baseTotalUsd: roundCurrencyAmount(baseTotalUsd, 'USD'),
    chargedTotal,
  };
}

export function updateCurrencyState(
  current: CurrencyRateState,
  updates: {
    bdtRate?: number;
    defaultCurrency?: CurrencyCode;
    source?: string;
    updateFrequencyMinutes?: number;
  }
): CurrencyRateState {
  const nextBdtRate =
    typeof updates.bdtRate === 'number' && Number.isFinite(updates.bdtRate) && updates.bdtRate >= 50 && updates.bdtRate <= 500
      ? Math.round(updates.bdtRate * 100) / 100
      : current.rates.BDT;

  return {
    ...current,
    defaultCurrency: updates.defaultCurrency === 'USD' || updates.defaultCurrency === 'BDT'
      ? updates.defaultCurrency
      : current.defaultCurrency,
    rates: {
      ...current.rates,
      BDT: nextBdtRate,
    },
    source: updates.source?.trim() ? updates.source.trim() : current.source,
    updateFrequencyMinutes:
      typeof updates.updateFrequencyMinutes === 'number' && updates.updateFrequencyMinutes >= 1
        ? Math.round(updates.updateFrequencyMinutes)
        : current.updateFrequencyMinutes,
    updatedAt: new Date().toISOString(),
  };
}
