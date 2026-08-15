import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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

export default function SettingsScreen() {
  const router = useRouter();
  const { isCompactLayout } = useResponsiveLayout();
  const {
    user,
    business,
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
  const [businessName, setBusinessName] = useState(business?.name ?? '');
  const [cnpj, setCnpj] = useState(business?.cnpj ?? '');
  const [phone, setPhone] = useState(business?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({});
  const [passwordError, setPasswordError] = useState<string>();

  useEffect(() => {
    if (!saveSuccessMessage) return;
    const timer = setTimeout(() => clearSaveSuccessMessage(), 4000);
    return () => clearTimeout(timer);
  }, [saveSuccessMessage, clearSaveSuccessMessage]);

  const handleSaveAccount = () => {
    const result = updateAccount({ name, email });
    if (!result.success) {
      setEmailError(result.emailError);
      return;
    }
    setEmailError(undefined);
  };

  const handleSaveBusiness = () => {
    const result = updateBusiness({ name: businessName, cnpj, phone });
    if (!result.success) {
      setBusinessErrors(result.errors ?? {});
      return;
    }
    setBusinessErrors({});
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

  const handleLogout = () => {
    logout();
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
          <Button label="Salvar alterações" onPress={handleSaveBusiness} />
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
