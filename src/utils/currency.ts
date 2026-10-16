/**
 * Accurate currency arithmetic helpers using integer paise (1 INR = 100 paise)
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function calculateLineTotal(unitPriceRupees: number, quantity: number): number {
  const unitPaise = toPaise(unitPriceRupees);
  const totalPaise = unitPaise * Math.max(0, quantity);
  return fromPaise(totalPaise);
}

export function calculateGrandTotal(items: { unitPrice: number; quantity: number }[]): number {
  const totalPaise = items.reduce((sum, item) => {
    return sum + (toPaise(item.unitPrice) * Math.max(0, item.quantity));
  }, 0);
  return fromPaise(totalPaise);
}

export function formatINR(amount: number): string {
  // Always format as whole or 2 decimal places if needed, prefixed with ₹
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `₹${formatted}`;
}
