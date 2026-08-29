import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { DEMO_EMAIL, DEMO_PASSWORD, IS_DEMO } from '@/constants/demo';
import { MOCK_BUSINESS, MOCK_USER } from '@/data/initialData';
import { getEmailError, getPasswordError } from '@/utils/validation';

type BusinessData = {
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

type AuthContextValue = {
  isAuthenticated: boolean;
  user: UserData | null;
  business: BusinessData | null;
  saveSuccessMessage: string | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (account: RegisterAccountData, business: BusinessData) => void;
  updateAccount: (data: { name: string; email: string }) => { success: boolean; emailError?: string };
  updateBusiness: (data: BusinessData) => { success: boolean; errors?: Record<string, string> };
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  clearSaveSuccessMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [storedPassword, setStoredPassword] = useState(DEMO_PASSWORD);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const login = useCallback((email: string, password: string) => {
    if (IS_DEMO) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        return { success: false, error: 'Use as credenciais de demonstração exibidas na tela de login.' };
      }
    }

    setUser({ ...MOCK_USER, email: IS_DEMO ? DEMO_EMAIL : email.trim() });
    setBusiness(MOCK_BUSINESS);
    setIsAuthenticated(true);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setBusiness(null);
  }, []);

  const register = useCallback((account: RegisterAccountData, businessData: BusinessData) => {
    setUser({
      name: account.name,
      email: account.email,
      role: 'Administrador',
      initials: buildInitials(account.name),
    });
    setBusiness(businessData);
    setStoredPassword(account.password);
    setIsAuthenticated(true);
  }, []);

  const updateAccount = useCallback((data: { name: string; email: string }) => {
    const emailError = getEmailError(data.email);
    if (emailError) return { success: false, emailError };
    setUser((current) =>
      current
        ? {
            ...current,
            name: data.name.trim(),
            email: data.email.trim(),
            initials: buildInitials(data.name),
          }
        : current,
    );
    setSaveSuccessMessage('Alterações salvas com sucesso.');
    return { success: true };
  }, []);

  const updateBusiness = useCallback((data: BusinessData) => {
    const errors: Record<string, string> = {};
    if (!data.name.trim()) errors.name = 'Informe o nome do negócio.';
    const cnpjDigits = normalizeCnpjDigits(data.cnpj);
    if (cnpjDigits && cnpjDigits.length !== 14) errors.cnpj = 'Informe um CNPJ com 14 dígitos.';
    const phoneDigits = normalizePhoneDigits(data.phone);
    if (phoneDigits && phoneDigits.length < 10) errors.phone = 'Informe um telefone válido.';
    if (Object.keys(errors).length > 0) return { success: false, errors };

    setBusiness({
      name: data.name.trim(),
      cnpj: data.cnpj?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
    });
    setSaveSuccessMessage('Alterações salvas com sucesso.');
    return { success: true };
  }, []);

  const changePassword = useCallback((currentPassword: string, newPassword: string) => {
    if (currentPassword !== storedPassword) {
      return { success: false, error: 'Senha atual incorreta.' };
    }
    const passwordError = getPasswordError(newPassword);
    if (passwordError) return { success: false, error: passwordError };
    setStoredPassword(newPassword);
    setSaveSuccessMessage('Senha alterada com sucesso.');
    return { success: true };
  }, [storedPassword]);

  const clearSaveSuccessMessage = useCallback(() => {
    setSaveSuccessMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      business,
      saveSuccessMessage,
      login,
      logout,
      register,
      updateAccount,
      updateBusiness,
      changePassword,
      clearSaveSuccessMessage,
    }),
    [
      isAuthenticated,
      user,
      business,
      saveSuccessMessage,
      login,
      logout,
      register,
      updateAccount,
      updateBusiness,
      changePassword,
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
