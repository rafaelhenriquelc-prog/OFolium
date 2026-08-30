import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { BrandColors } from '@/constants/colors';
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
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [loginError, setLoginError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;

    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setLoginError(undefined);

    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setLoginError(result.error);
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      compactMobile
      title="Gerencie sua equipe de forma simples."
      subtitle="Acesse sua conta para continuar."
      footer={isMobile ? <LoginLinks mobile /> : undefined}>
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
          if (loginError) setLoginError(undefined);
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
          if (loginError) setLoginError(undefined);
        }}
        error={passwordError}
      />

      <View style={[styles.actions, isMobile && styles.actionsMobile]}>
        <Button
          label="Entrar"
          fullWidth
          loading={isSubmitting}
          loadingLabel="Entrando..."
          onPress={handleLogin}
          style={isMobile ? styles.loginButton : undefined}
        />
      </View>

      {!isMobile && <LoginLinks />}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
