// PRD 4.B: these are record-keeping labels the user picks. LIFORA does
// not integrate with, authenticate against, or read from any of these apps.
export const PAYMENT_METHODS = ['google_pay', 'phonepe', 'paytm', 'bank_transfer', 'cash', 'card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  google_pay: 'Google Pay',
  phonepe: 'PhonePe',
  paytm: 'Paytm',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  card: 'Credit/Debit Card',
  other: 'Other',
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);
}
