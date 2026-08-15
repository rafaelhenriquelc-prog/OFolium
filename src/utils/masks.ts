export function filterDigits(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '');
  return maxLength !== undefined ? digits.slice(0, maxLength) : digits;
}

export function formatPhoneInput(value: string): string {
  const digits = filterDigits(value, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCnpjInput(value: string): string {
  const digits = filterDigits(value, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatCurrencyInput(value: string): string {
  const digits = filterDigits(value, 15);
  if (!digits) return '';

  const amount = parseInt(digits, 10) / 100;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export type NumericMask = 'phone' | 'cnpj' | 'currency' | 'digits';

export function applyNumericMask(value: string, mask: NumericMask): string {
  switch (mask) {
    case 'phone':
      return formatPhoneInput(value);
    case 'cnpj':
      return formatCnpjInput(value);
    case 'currency':
      return formatCurrencyInput(value);
    case 'digits':
      return filterDigits(value);
  }
}

export const numericMaskMaxLength: Record<NumericMask, number | undefined> = {
  phone: 15,
  cnpj: 18,
  currency: 22,
  digits: undefined,
};

export const numericMaskPlaceholder: Partial<Record<NumericMask, string>> = {
  phone: '(00) 00000-0000',
  cnpj: '00.000.000/0000-00',
  currency: 'R$ 0,00',
};
