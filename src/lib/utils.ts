import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`
}

export function getCostColor(cost: number): string {
  if (cost < 1) return 'text-cost-low'
  if (cost < 5) return 'text-cost-medium'
  return 'text-cost-high'
}

export function getCostBgColor(cost: number): string {
  if (cost < 1) return 'bg-cost-low/10'
  if (cost < 5) return 'bg-cost-medium/10'
  return 'bg-cost-high/10'
}

export function calculateTrend(current: number, previous: number): {
  value: number
  direction: 'up' | 'down' | 'neutral'
} {
  if (previous === 0) return { value: 0, direction: 'neutral' }
  const percentChange = ((current - previous) / previous) * 100
  return {
    value: Math.abs(percentChange),
    direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
  }
}