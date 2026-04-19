import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function toIsoDate(value: Date | string | number) {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: Date | string | number) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatShortDisplayDate(value: Date | string | number) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDatesInText(value: string, variant: 'long' | 'short' = 'long') {
  return value.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (match) =>
    variant === 'short' ? formatShortDisplayDate(match) : formatDisplayDate(match),
  );
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function formatAssetIdentity(ticker: string, name: string) {
  return ticker.toUpperCase() === name.toUpperCase() ? ticker : `${ticker} (${name})`;
}
