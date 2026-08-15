import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandColors } from '@/constants/colors';
import { getEmailError } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string>();

  const handleSend = () => {
    const nextEmailError = getEmailError(email);
    setEmailError(nextEmailError);
    if (nextEmailError) return;
    setSent(true);
  };

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle={
        sent
          ? undefined
          : 'Informe seu e-mail e enviaremos as instruções para redefinir sua senha.'
      }>
      {sent ? (
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>Enviamos as instruções para o seu e-mail.</Text>
        </View>
      ) : (
        <>
          <Input
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
          <Button label="Enviar instruções" fullWidth onPress={handleSend} />
        </>
      )}

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
  successBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.greenLight,
    color: BrandColors.green,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 48,
    overflow: 'hidden',
  },
  successText: {
    fontSize: 15,
    color: BrandColors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
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
