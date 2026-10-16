/**
 * Date, time, and phone formatters specifically tuned for Pizza Bite (Asia/Kolkata timezone)
 */

export function isValidIndianPhone(phone: string): boolean {
  const sanitized = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(sanitized);
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

export function formatISTTime(isoDateString: string): string {
  const date = new Date(isoDateString);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatISTDateTime(isoDateString: string): string {
  const date = new Date(isoDateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getElapsedTimeString(isoDateString: string, now: Date = new Date()): string {
  const past = new Date(isoDateString).getTime();
  const current = now.getTime();
  const diffSec = Math.max(0, Math.floor((current - past) / 1000));

  if (diffSec < 30) {
    return 'Just now';
  }
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }
  const diffMin = Math.floor(diffSec / 60);
  const remainingSec = diffSec % 60;
  if (diffMin < 60) {
    return `${diffMin}m ${remainingSec}s ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ${diffMin % 60}m ago`;
}

export function generateOrderNumber(sequenceNum: number): string {
  return `PB-${sequenceNum}`;
}

export function generateBillId(date: Date, orderNumber: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const numPart = orderNumber.replace(/\D/g, '') || '0000';
  return `PB-${year}${month}${day}-${numPart}`;
}
