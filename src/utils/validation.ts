export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function getEmailError(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Informe seu e-mail.';
  if (!trimmed.includes('@')) return 'O e-mail deve conter @.';
  if (!isValidEmail(trimmed)) return 'Informe um e-mail válido.';
  return undefined;
}

export function getPasswordError(password: string): string | undefined {
  if (!password.trim()) return 'Informe sua senha.';
  return undefined;
}
