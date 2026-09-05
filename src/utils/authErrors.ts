export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered') ||
    normalized.includes('email address is already')
  ) {
    return 'Este e-mail já está cadastrado.';
  }

  if (normalized.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }

  if (normalized.includes('unable to validate email address')) {
    return 'Informe um endereço de e-mail válido.';
  }

  if (normalized.includes('signup is disabled')) {
    return 'O cadastro está temporariamente indisponível.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }

  if (normalized.includes('rate limit')) {
    return 'Muitas tentativas em sequência. Aguarde um momento e tente novamente.';
  }

  if (
    normalized.includes('email link is invalid') ||
    normalized.includes('otp_expired') ||
    normalized.includes('token has expired') ||
    normalized.includes('invalid or has expired') ||
    normalized.includes('auth session missing')
  ) {
    return 'Link inválido ou expirado. Solicite uma nova recuperação de senha.';
  }

  if (normalized.includes('same password')) {
    return 'A nova senha deve ser diferente da senha atual.';
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}
