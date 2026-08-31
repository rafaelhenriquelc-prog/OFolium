import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/mobile/Screen';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { BrandColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatCnpjInput, formatPhoneInput } from '@/utils/masks';

export default function SettingsScreen() {
  const router = useRouter();
  const { isCompactLayout } = useResponsiveLayout();
  const {
    user,
    business,
    isBusinessLoading,
    businessError,
    logout,
    updateAccount,
    updateBusiness,
    changePassword,
    saveSuccessMessage,
    clearSaveSuccessMessage,
  } = useAuth();
  const { planName, activeLimit, sidebarLinkLabel, isPro } = usePlan();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [businessName, setBusinessName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({});
  const [businessSaveError, setBusinessSaveError] = useState<string>();
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();

  useEffect(() => {
    if (!saveSuccessMessage) return;
    const timer = setTimeout(() => clearSaveSuccessMessage(), 4000);
    return () => clearTimeout(timer);
  }, [saveSuccessMessage, clearSaveSuccessMessage]);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (isBusinessLoading) return;

    setBusinessName(business?.name ?? '');
    setCnpj(business?.cnpj ? formatCnpjInput(business.cnpj) : '');
    setPhone(business?.phone ? formatPhoneInput(business.phone) : '');
  }, [business, isBusinessLoading]);

  const handleSaveAccount = () => {
    const result = updateAccount({ name, email });
    if (!result.success) {
      setEmailError(result.emailError);
      return;
    }
    setEmailError(undefined);
  };

  const handleSaveBusiness = async () => {
    if (isSavingBusiness || isBusinessLoading || businessError) return;

    setBusinessSaveError(undefined);
    setIsSavingBusiness(true);

    try {
      const result = await updateBusiness({ name: businessName, cnpj, phone });
      if (!result.success) {
        if (result.errors) {
          setBusinessErrors(result.errors);
          setBusinessSaveError(undefined);
        } else {
          setBusinessErrors({});
          setBusinessSaveError(result.error);
        }
        return;
      }

      setBusinessErrors({});
      setBusinessSaveError(undefined);
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleChangePassword = () => {
    const result = changePassword(currentPassword, newPassword);
    if (!result.success) {
      setPasswordError(result.error);
      return;
    }
    setPasswordError(undefined);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen contentStyle={isCompactLayout ? styles.contentCompact : styles.contentDesktop}>
      <PageHeader title="Configurações" subtitle="Gerencie sua conta e preferências." />

      {saveSuccessMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{saveSuccessMessage}</Text>
        </View>
      )}

      <View style={styles.sections}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Minha conta</Text>
          <View style={styles.fields}>
            <Input label="Nome" value={name} onChangeText={setName} />
            <Input
              label="E-mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(undefined);
              }}
              keyboardType="email-address"
              error={emailError}
            />
          </View>
          <Button label="Salvar alterações" onPress={handleSaveAccount} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Alterar senha</Text>
          <View style={styles.fields}>
            <PasswordInput
              label="Senha atual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <PasswordInput
              label="Nova senha"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (passwordError) setPasswordError(undefined);
              }}
              error={passwordError}
            />
          </View>
          <Button label="Alterar senha" variant="outline" onPress={handleChangePassword} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do negócio</Text>
          {isBusinessLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={BrandColors.orange} />
              <Text style={styles.loadingText}>Carregando dados do negócio...</Text>
            </View>
          ) : (
            <>
              {businessError && <Text style={styles.errorText}>{businessError}</Text>}
              {businessSaveError && <Text style={styles.errorText}>{businessSaveError}</Text>}
              <View style={styles.fields}>
                <Input
                  label="Nome do negócio"
                  value={businessName}
                  onChangeText={setBusinessName}
                  error={businessErrors.name}
                />
                <MaskedInput
                  label="CNPJ"
                  optional
                  mask="cnpj"
                  value={cnpj}
                  onChangeText={setCnpj}
                  error={businessErrors.cnpj}
                />
                <Text style={styles.helperText}>
                  O CNPJ será utilizado apenas para identificar o negócio e seus demonstrativos gerenciais.
                </Text>
                <MaskedInput
                  label="Telefone"
                  optional
                  mask="phone"
                  value={phone}
                  onChangeText={setPhone}
                  error={businessErrors.phone}
                />
              </View>
              <Button
                label="Salvar alterações"
                loading={isSavingBusiness}
                loadingLabel="Salvando..."
                disabled={isBusinessLoading || !!businessError}
                onPress={handleSaveBusiness}
              />
            </>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Plano</Text>
          <View style={styles.planInfo}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{isPro ? 'Pro' : 'Base'}</Text>
            </View>
            <Text style={styles.planLimit}>
              Limite de {activeLimit} funcionários ativos — {planName}
            </Text>
            <Button
              label={sidebarLinkLabel}
              variant="ghost"
              onPress={() => router.push('/pro' as Href)}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.preferences}>
            <PreferenceRow label="Notificações" value="Ativadas" />
            <PreferenceRow label="Idioma" value="Português (BR)" />
          </View>
        </Card>

        <View style={styles.logoutSection}>
          <Button label="Sair" variant="outline" onPress={handleLogout} />
        </View>
      </View>
    </Screen>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <View style={styles.preferenceValue}>
        <Text style={styles.preferenceValueText}>{value}</Text>
        <Text style={styles.preferenceChevron}>▾</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentDesktop: { maxWidth: 640, alignSelf: 'center', width: '100%' },
  contentCompact: { width: '100%' },
  successBanner: {
    backgroundColor: BrandColors.greenLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.green,
  },
  sections: { gap: 20 },
  section: { gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.textPrimary },
  fields: { gap: 14 },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textMuted,
    marginTop: -6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: BrandColors.red,
    textAlign: 'center',
  },
  planInfo: { gap: 12 },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: { fontSize: 14, fontWeight: '700', color: BrandColors.orange },
  planLimit: { fontSize: 14, color: BrandColors.textSecondary },
  preferences: { gap: 12 },
  preferenceRow: { gap: 6 },
  preferenceLabel: { fontSize: 13, fontWeight: '600', color: BrandColors.textPrimary },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.offWhite,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  preferenceValueText: { fontSize: 14, color: BrandColors.textPrimary },
  preferenceChevron: { fontSize: 12, color: BrandColors.textMuted },
  logoutSection: { marginTop: 8 },
});
