import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getLevel(xpTotal: number): number {
  return Math.floor(xpTotal / 100) + 1;
}

export function getXpInCurrentLevel(xpTotal: number): number {
  return xpTotal % 100;
}

export const XP_PER_LEVEL = 100;

export function parseStepTitle(title: string): { displayTitle: string } | null {
  const match = title.match(/^\[(?:MKT|LG):[^\]]+\]\s*(.+)$/);
  if (!match) return null;
  return { displayTitle: match[1] };
}

export function stripBracketPrefix(title: string): string {
  return title.replace(/^\[[^\]]*\]\s*/, "");
}
