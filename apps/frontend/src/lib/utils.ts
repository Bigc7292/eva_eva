import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(number: number) {
  return new Intl.NumberFormat().format(number)
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercent(number: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number / 100)
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

