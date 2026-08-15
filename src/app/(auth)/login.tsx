import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { DemoBanner } from '@/components/DemoBanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { BrandColors } from '@/constants/colors';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/constants/demo';
import { MIN_TOUCH_TARGET, MOBILE_BREAKPOINT } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { getEmailError, getPasswordError } from '@/utils/validation';

function LoginLinks({ mobile }: { mobile?: boolean }) {
  return (
    <View style={[styles.links, mobile && styles.linksMobile]}>
      <Link href="/forgot-password" asChild>
        <Pressable style={mobile ? styles.linkHitArea : undefined}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </Pressable>
      </Link>
      <View style={[styles.registerRow, mobile && styles.registerRowMobile]}>
        <Text style={[styles.registerText, mobile && styles.registerTextMobile]}>Não tem conta? </Text>
        <Link href="/register" asChild>
          <Pressable style={mobile ? styles.linkHitAreaInline : undefined}>
            <Text style={styles.link}>Criar conta</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [loginError, setLoginError] = useState<string>();

  const handleLogin = () => {
    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) return;

    const result = login(email.trim(), password);
    if (!result.success) {
      setLoginError(result.error);
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <>
      <DemoBanner variant="auth" />
      <AuthLayout
      compactMobile
      title="Gerencie sua equipe de forma simples."
      subtitle="Acesse sua conta para continuar."
      footer={isMobile ? <LoginLinks mobile /> : undefined}>
      <View style={styles.demoCredentials}>
        <Text style={styles.demoCredentialsTitle}>Credenciais de demonstração</Text>
        <Text style={styles.demoCredentialsText}>
          E-mail: <Text style={styles.demoCredentialsValue}>{DEMO_EMAIL}</Text>
        </Text>
        <Text style={styles.demoCredentialsText}>
          Senha: <Text style={styles.demoCredentialsValue}>{DEMO_PASSWORD}</Text>
        </Text>
      </View>

      {loginError && <Text style={styles.loginError}>{loginError}</Text>}

      <Input
        compact
        label="E-mail"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) setEmailError(undefined);
        }}
        error={emailError}
      />
      <PasswordInput
        compact
        label="Senha"
        placeholder="••••••••"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError(undefined);
        }}
        error={passwordError}
      />

      <View style={[styles.actions, isMobile && styles.actionsMobile]}>
        <Button
          label="Entrar"
          fullWidth
          onPress={handleLogin}
          style={isMobile ? styles.loginButton : undefined}
        />
      </View>

      {!isMobile && <LoginLinks />}
    </AuthLayout>
    </>
  );
}

const styles = StyleSheet.create({
  demoCredentials: {
    backgroundColor: BrandColors.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  demoCredentialsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  demoCredentialsText: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  demoCredentialsValue: {
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  loginError: {
    fontSize: 13,
    color: BrandColors.red,
    textAlign: 'center',
  },
  actions: {
    marginTop: 8,
  },
  actionsMobile: {
    marginTop: 0,
  },
  loginButton: {
    minHeight: MIN_TOUCH_TARGET,
    maxHeight: 48,
    paddingVertical: 8,
  },
  links: {
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  linksMobile: {
    gap: 0,
    marginTop: 0,
    width: '100%',
  },
  linkHitArea: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  linkHitAreaInline: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.orange,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerRowMobile: {
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  registerTextMobile: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
