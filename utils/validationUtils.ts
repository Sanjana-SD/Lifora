export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function requireText(value: string, fieldLabel: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${fieldLabel} can't be empty.`);
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldLabel} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}
