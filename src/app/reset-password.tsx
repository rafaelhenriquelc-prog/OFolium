import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { BrandColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { isInitialRecoveryUrl, supabase } from '@/lib/supabase';
import { getConfirmPasswordError, getNewPasswordError } from '@/utils/validation';

type RecoveryStatus = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { completePasswordReset } = useAuth();

  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>('checking');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    let recoveryDetected = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetected = true;
        if (mounted) setRecoveryStatus('ready');
      }
    });

    const verifyRecoverySession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setRecoveryStatus('invalid');
        return;
      }

      if (recoveryDetected || (isInitialRecoveryUrl && data.session)) {
        setRecoveryStatus('ready');
        return;
      }

      setRecoveryStatus('invalid');
    };

    void verifyRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting || recoveryStatus !== 'ready') return;

    const nextNewPasswordError = getNewPasswordError(newPassword);
    const nextConfirmPasswordError = getConfirmPasswordError(newPassword, confirmPassword);

    setNewPasswordError(nextNewPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setFormError(undefined);

    if (nextNewPasswordError || nextConfirmPasswordError) return;

    setIsSubmitting(true);

    try {
      const result = await completePasswordReset(newPassword);
      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.replace('/login');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recoveryStatus === 'checking') {
    return (
      <AuthLayout title="Redefinir senha">
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={BrandColors.orange} />
          <Text style={styles.helperText}>Validando link de recuperação...</Text>
        </View>
      </AuthLayout>
    );
  }

  if (recoveryStatus === 'invalid') {
    return (
      <AuthLayout
        title="Link inválido"
        subtitle="Este link de recuperação é inválido ou expirou. Solicite um novo e-mail para redefinir sua senha.">
        <View style={styles.actions}>
          <Button
            label="Solicitar novo link"
            fullWidth
            onPress={() => router.push('/forgot-password')}
          />
        </View>
        <View style={styles.backLink}>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.link}>← Voltar para o login</Text>
            </Pressable>
          </Link>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Informe sua nova senha para concluir a recuperação.">
      {formError && <Text style={styles.formError}>{formError}</Text>}

      <PasswordInput
        label="Nova senha"
        placeholder="••••••••"
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          if (newPasswordError) setNewPasswordError(undefined);
          if (formError) setFormError(undefined);
        }}
        error={newPasswordError}
      />
      <PasswordInput
        label="Confirmar nova senha"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (confirmPasswordError) setConfirmPasswordError(undefined);
          if (formError) setFormError(undefined);
        }}
        error={confirmPasswordError}
      />

      <Button
        label="Salvar nova senha"
        fullWidth
        loading={isSubmitting}
        loadingLabel="Salvando..."
        onPress={handleSubmit}
      />

      <View style={styles.backLink}>
        <Link href="/login" asChild>
          <Pressable>
            <Text style={styles.link}>← Voltar para o login</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  helperText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  formError: {
    fontSize: 13,
    color: BrandColors.red,
    textAlign: 'center',
  },
  actions: {
    marginTop: 8,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 4,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.orange,
  },
});
