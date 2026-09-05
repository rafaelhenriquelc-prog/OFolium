import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { PlanTier } from '@/constants/plans';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/utils/authErrors';
import { getConfirmPasswordError, getEmailError, getNewPasswordError } from '@/utils/validation';

export type BusinessData = {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  planTier: PlanTier;
  trialEndsAt: string | null;
};

type BusinessInput = {
  name: string;
  cnpj?: string;
  phone?: string;
};

type UserData = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

type RegisterAccountData = {
  name: string;
  email: string;
  password: string;
};

type LoginResult = { success: true } | { success: false; error: string };

type RegisterResult =
  | { success: true; needsEmailConfirmation?: boolean; message?: string }
  | { success: false; error: string };

type UpdateBusinessResult =
  | { success: true }
  | { success: false; errors?: Record<string, string>; error?: string };

type PasswordResetRequestResult = { success: true } | { success: false; error: string };

type CompletePasswordResetResult = { success: true } | { success: false; error: string };

type ChangePasswordResult = { success: true } | { success: false; error: string };

type UpdateAccountResult =
  | { success: true; message: string; emailChangePending?: boolean }
  | { success: false; emailError?: string; error?: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isBusinessLoading: boolean;
  businessError: string | null;
  session: Session | null;
  user: UserData | null;
  business: BusinessData | null;
  saveSuccessMessage: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (account: RegisterAccountData, business: BusinessInput) => Promise<RegisterResult>;
  updateAccount: (data: { name: string; email: string }) => Promise<UpdateAccountResult>;
  updateBusiness: (data: BusinessInput) => Promise<UpdateBusinessResult>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<ChangePasswordResult>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResult>;
  completePasswordReset: (password: string) => Promise<CompletePasswordResetResult>;
  clearSaveSuccessMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type BusinessRow = {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  plan_tier: string;
  trial_ends_at: string | null;
};

function buildInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function normalizeCnpjDigits(value?: string): string {
  return (value ?? '').replace(/\D/g, '');
}

function normalizePhoneDigits(value?: string): string {
  return (value ?? '').replace(/\D/g, '');
}

function mapBusinessRow(row: BusinessRow): BusinessData {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj ?? undefined,
    phone: row.phone ?? undefined,
    planTier: row.plan_tier === 'pro' ? 'pro' : 'base',
    trialEndsAt: row.trial_ends_at,
  };
}

function translateBusinessError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'Você não tem permissão para alterar estes dados.';
  }

  if (normalized.includes('duplicate key') || normalized.includes('unique constraint')) {
    if (normalized.includes('cnpj')) {
      return 'Este CNPJ já está cadastrado.';
    }
    return 'Já existe um negócio cadastrado para esta conta.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível salvar os dados do negócio. Tente novamente.';
}

function getPasswordResetRedirectUrl(): string {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    const origin = globalThis.window.location.origin;
    if (origin) return `${origin}/reset-password`;
  }

  return 'https://o-folium.vercel.app/reset-password';
}

function translateProfileError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'Você não tem permissão para alterar estes dados.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível salvar o nome no perfil. Tente novamente.';
}

function isEmailAlreadyRegistered(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already registered') || normalized.includes('email address is already')
  );
}

function mapSessionUser(session: Session): UserData {
  const metadataName = session.user.user_metadata?.full_name;
  const name =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : session.user.email?.split('@')[0] ?? 'Usuário';

  return {
    name,
    email: session.user.email ?? '',
    role: 'Administrador',
    initials: buildInitials(name),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession) {
      setUser(null);
      setBusiness(null);
      setBusinessError(null);
      setIsBusinessLoading(false);
      return;
    }

    setUser(mapSessionUser(nextSession));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.warn('Erro ao recuperar sessão:', error.message);
      }

      applySession(data.session ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      applySession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    let mounted = true;
    const userId = session?.user.id;

    if (!userId) {
      return () => {
        mounted = false;
      };
    }

    setIsBusinessLoading(true);
    setBusinessError(null);
    setBusiness(null);

    supabase
      .from('businesses')
      .select('id, name, cnpj, phone, plan_tier, trial_ends_at')
      .eq('owner_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;

        setIsBusinessLoading(false);

        if (error) {
          setBusinessError('Não foi possível carregar os dados do negócio.');
          setBusiness(null);
          return;
        }

        setBusiness(data ? mapBusinessRow(data as BusinessRow) : null);
      });

    return () => {
      mounted = false;
    };
  }, [session?.user.id]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }

    if (!data.session) {
      return {
        success: false,
        error: 'Não foi possível iniciar a sessão. Tente novamente.',
      };
    }

    applySession(data.session);
    return { success: true };
  }, [applySession]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Erro ao encerrar sessão:', error.message);
    }
    applySession(null);
  }, [applySession]);

  const register = useCallback(
    async (account: RegisterAccountData, businessData: BusinessInput): Promise<RegisterResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: account.email.trim(),
        password: account.password,
        options: {
          data: {
            full_name: account.name.trim(),
            business_name: businessData.name.trim(),
            business_cnpj: normalizeCnpjDigits(businessData.cnpj),
            business_phone: normalizePhoneDigits(businessData.phone),
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      if (!data.session) {
        return {
          success: true,
          needsEmailConfirmation: true,
          message:
            'Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para ativar sua conta antes de entrar.',
        };
      }

      applySession(data.session);

      return { success: true };
    },
    [applySession],
  );

  const updateAccount = useCallback(
    async (data: { name: string; email: string }): Promise<UpdateAccountResult> => {
      const trimmedName = data.name.trim();
      const trimmedEmail = data.email.trim();

      if (!trimmedName) {
        return { success: false, error: 'Informe seu nome.' };
      }

      const emailValidationError = getEmailError(trimmedEmail);
      if (emailValidationError) {
        return { success: false, emailError: emailValidationError };
      }

      if (!session?.user.id) {
        return { success: false, error: 'Sessão inválida. Faça login novamente.' };
      }

      const userId = session.user.id;
      const currentEmail = session.user.email ?? '';
      const currentName = mapSessionUser(session).name;
      const nameChanged = trimmedName !== currentName;
      const emailChanged = trimmedEmail.toLowerCase() !== currentEmail.toLowerCase();

      if (!nameChanged && !emailChanged) {
        const message = 'Nenhuma alteração para salvar.';
        setSaveSuccessMessage(message);
        return { success: true, message };
      }

      const emailConfirmationMessage =
        'Enviamos um link de confirmação para o novo e-mail. Seu endereço atual continuará válido até a confirmação.';

      if (nameChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: trimmedName },
          ...(emailChanged ? { email: trimmedEmail } : {}),
        });

        if (authError) {
          if (isEmailAlreadyRegistered(authError.message)) {
            return { success: false, emailError: translateAuthError(authError.message) };
          }
          return { success: false, error: translateAuthError(authError.message) };
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: trimmedName })
          .eq('id', userId);

        if (profileError) {
          return { success: false, error: translateProfileError(profileError.message) };
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          applySession(sessionData.session);
        } else {
          setUser((current) =>
            current
              ? {
                  ...current,
                  name: trimmedName,
                  initials: buildInitials(trimmedName),
                }
              : current,
          );
        }

        if (emailChanged) {
          const message = `Nome atualizado. ${emailConfirmationMessage}`;
          setSaveSuccessMessage(message);
          return { success: true, message, emailChangePending: true };
        }

        const message = 'Alterações salvas com sucesso.';
        setSaveSuccessMessage(message);
        return { success: true, message };
      }

      const { error: authError } = await supabase.auth.updateUser({ email: trimmedEmail });

      if (authError) {
        if (isEmailAlreadyRegistered(authError.message)) {
          return { success: false, emailError: translateAuthError(authError.message) };
        }
        return { success: false, error: translateAuthError(authError.message) };
      }

      setSaveSuccessMessage(emailConfirmationMessage);
      return { success: true, message: emailConfirmationMessage, emailChangePending: true };
    },
    [session, applySession],
  );

  const updateBusiness = useCallback(
    async (data: BusinessInput): Promise<UpdateBusinessResult> => {
      const errors: Record<string, string> = {};
      if (!data.name.trim()) errors.name = 'Informe o nome do negócio.';
      const cnpjDigits = normalizeCnpjDigits(data.cnpj);
      if (cnpjDigits && cnpjDigits.length !== 14) errors.cnpj = 'Informe um CNPJ com 14 dígitos.';
      const phoneDigits = normalizePhoneDigits(data.phone);
      if (phoneDigits && phoneDigits.length < 10) errors.phone = 'Informe um telefone válido.';
      if (Object.keys(errors).length > 0) return { success: false, errors };

      const ownerId = session?.user.id;
      if (!ownerId) {
        return { success: false, error: 'Sessão inválida. Faça login novamente.' };
      }

      const name = data.name.trim();
      const cnpj = cnpjDigits || null;
      const phone = phoneDigits || null;

      if (business?.id) {
        const { data: updated, error } = await supabase
          .from('businesses')
          .update({ name, cnpj, phone })
          .eq('id', business.id)
          .select('id, name, cnpj, phone, plan_tier, trial_ends_at')
          .single();

        if (error) {
          return { success: false, error: translateBusinessError(error.message) };
        }

        setBusiness(mapBusinessRow(updated as BusinessRow));
        setSaveSuccessMessage('Alterações salvas com sucesso.');
        return { success: true };
      }

      const { data: inserted, error } = await supabase
        .from('businesses')
        .insert({
          owner_id: ownerId,
          name,
          cnpj,
          phone,
          plan_tier: 'base',
          trial_ends_at: null,
        })
        .select('id, name, cnpj, phone, plan_tier, trial_ends_at')
        .single();

      if (error) {
        return { success: false, error: translateBusinessError(error.message) };
      }

      setBusiness(mapBusinessRow(inserted as BusinessRow));
      setSaveSuccessMessage('Alterações salvas com sucesso.');
      return { success: true };
    },
    [business, session],
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string,
    ): Promise<ChangePasswordResult> => {
      if (!currentPassword.trim()) {
        return { success: false, error: 'Informe sua senha atual.' };
      }

      const newPasswordError = getNewPasswordError(newPassword);
      if (newPasswordError) return { success: false, error: newPasswordError };

      const confirmPasswordError = getConfirmPasswordError(newPassword, confirmPassword);
      if (confirmPasswordError) return { success: false, error: confirmPasswordError };

      const email = session?.user.email;
      if (!email) {
        return { success: false, error: 'Sessão inválida. Faça login novamente.' };
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          return { success: false, error: 'Senha atual incorreta.' };
        }
        return { success: false, error: translateAuthError(authError.message) };
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        return { success: false, error: translateAuthError(updateError.message) };
      }

      setSaveSuccessMessage('Senha alterada com sucesso.');
      return { success: true };
    },
    [session],
  );

  const requestPasswordReset = useCallback(async (email: string): Promise<PasswordResetRequestResult> => {
    const emailError = getEmailError(email);
    if (emailError) return { success: false, error: emailError };

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });

    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }

    return { success: true };
  }, []);

  const completePasswordReset = useCallback(
    async (password: string): Promise<CompletePasswordResetResult> => {
      const passwordError = getNewPasswordError(password);
      if (passwordError) return { success: false, error: passwordError };

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn('Erro ao encerrar sessão após redefinição de senha.');
      }

      applySession(null);
      return { success: true };
    },
    [applySession],
  );

  const clearSaveSuccessMessage = useCallback(() => {
    setSaveSuccessMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: session !== null,
      isLoading,
      isBusinessLoading,
      businessError,
      session,
      user,
      business,
      saveSuccessMessage,
      login,
      logout,
      register,
      updateAccount,
      updateBusiness,
      changePassword,
      requestPasswordReset,
      completePasswordReset,
      clearSaveSuccessMessage,
    }),
    [
      session,
      isLoading,
      isBusinessLoading,
      businessError,
      user,
      business,
      saveSuccessMessage,
      login,
      logout,
      register,
      updateAccount,
      updateBusiness,
      changePassword,
      requestPasswordReset,
      completePasswordReset,
      clearSaveSuccessMessage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
