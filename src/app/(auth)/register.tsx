import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { BrandColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { getEmailError, getPasswordError } from '@/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');

  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [businessNameError, setBusinessNameError] = useState<string>();

  const handleContinue = () => {
    const nextNameError = !name.trim() ? 'Informe seu nome completo.' : undefined;
    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);
    const nextConfirmPasswordError =
      !confirmPassword.trim()
        ? 'Confirme sua senha.'
        : confirmPassword !== password
          ? 'As senhas não coincidem.'
          : undefined;

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);

    if (nextNameError || nextEmailError || nextPasswordError || nextConfirmPasswordError) return;

    setStep(2);
  };

  const handleRegister = () => {
    const nextBusinessNameError = !businessName.trim() ? 'Informe o nome do negócio.' : undefined;
    setBusinessNameError(nextBusinessNameError);
    if (nextBusinessNameError) return;

    register(
      { name: name.trim(), email: email.trim(), password },
      { name: businessName.trim(), cnpj: cnpj || undefined, phone: phone || undefined },
    );
    router.replace('/dashboard');
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Criar conta' : 'Seu negócio'}
      subtitle={
        step === 1
          ? 'Etapa 1 de 2 — Sua conta'
          : 'Etapa 2 de 2 — Você poderá completar ou alterar esses dados depois.'
      }>
      {step === 1 ? (
        <>
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(undefined);
            }}
            error={nameError}
          />
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
          <PasswordInput
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
            }}
            error={passwordError}
          />
          <PasswordInput
            label="Confirmar senha"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError(undefined);
            }}
            error={confirmPasswordError}
          />
          <Button label="Continuar" fullWidth onPress={handleContinue} />
        </>
      ) : (
        <>
          <Input
            label="Nome do negócio"
            placeholder="Ex: Padaria São Lucas"
            value={businessName}
            onChangeText={(text) => {
              setBusinessName(text);
              if (businessNameError) setBusinessNameError(undefined);
            }}
            error={businessNameError}
          />
          <MaskedInput
            label="CNPJ"
            optional
            mask="cnpj"
            value={cnpj}
            onChangeText={setCnpj}
          />
          <MaskedInput
            label="Telefone"
            optional
            mask="phone"
            value={phone}
            onChangeText={setPhone}
          />
          <View style={styles.stepActions}>
            <Button label="Voltar" variant="outline" onPress={() => setStep(1)} />
            <View style={styles.primaryAction}>
              <Button label="Criar minha conta" fullWidth onPress={handleRegister} />
            </View>
          </View>
        </>
      )}

      <View style={styles.footerLink}>
        <Text style={styles.footerText}>Já tem conta? </Text>
        <Link href="/login" asChild>
          <Pressable>
            <Text style={styles.link}>Entrar</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  stepActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    flex: 1,
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.orange,
  },
});
