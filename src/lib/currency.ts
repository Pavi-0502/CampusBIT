/**
 * Exact integer paise <-> Rupee conversions and Indian Number System formatting
 * (e.g. ₹1,800, ₹12,500, ₹1,50,000)
 */

export function paiseToRupees(paise: number): number {
  return Math.floor(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats integer paise into Indian Rupee string with ₹ symbol and Indian comma placement
 * (Lakhs and Crores format: ##,##,###)
 */
export function formatPaise(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return formatRupees(rupees);
}

/**
 * Formats integer Rupees into Indian comma formatted currency
 */
export function formatRupees(rupees: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(rupees);
}

/**
 * Formats difference or increment in paise
 */
export function formatIncrement(paise: number): string {
  return `+${formatPaise(paise)}`;
}
