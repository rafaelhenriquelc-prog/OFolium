export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (normalized.includes('user already registered')) {
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

  return 'Não foi possível concluir a operação. Tente novamente.';
}
