import { useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { HEADER_BELL_ICON } from '@/constants/statIcons';
import { MIN_TOUCH_TARGET, MobileType } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { matchesEmployeeQuery } from '@/utils/employeeSearch';

type HeaderProps = {
  onNotificationPress?: () => void;
  isNotificationsPanelOpen?: boolean;
  employeeQuery: string;
  onEmployeeQueryChange: (value: string) => void;
  competenceLabel?: string;
  onPreviousCompetence?: () => void;
  onNextCompetence?: () => void;
  canAdvanceCompetence?: boolean;
  competenceNotice?: string | null;
};

export function Header({
  onNotificationPress,
  isNotificationsPanelOpen,
  employeeQuery,
  onEmployeeQueryChange,
  competenceLabel,
  onPreviousCompetence,
  onNextCompetence,
  canAdvanceCompetence = false,
  competenceNotice,
}: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { unreadNotificationCount } = useAppData();
  const { isMobile } = useResponsiveLayout();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Lucas';
  const badgeCount = unreadNotificationCount > 0 ? String(unreadNotificationCount) : null;

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }
    router.push('/notifications' as Href);
  };

  const searchResults = useMemo(() => {
    const query = employeeQuery.trim();
    if (!query) return [];
    return employees.filter((employee) => matchesEmployeeQuery(employee, query)).slice(0, 6);
  }, [employeeQuery, employees]);

  const openEmployee = (employeeId: string) => {
    setIsSearchOpen(false);
    onEmployeeQueryChange('');
    router.push(`/employees/${employeeId}` as Href);
  };

  const submitSearch = () => {
    const query = employeeQuery.trim();
    if (!query) return;
    if (searchResults.length === 1) {
      openEmployee(searchResults[0].id);
      return;
    }
    setIsSearchOpen(false);
    router.push(`/employees?q=${encodeURIComponent(query)}` as Href);
  };

  const notificationAccessibilityLabel = onNotificationPress
    ? isNotificationsPanelOpen
      ? 'Fechar painel de notificações'
      : 'Abrir painel de notificações'
    : 'Notificações';

  if (isMobile) {
    return (
      <View style={styles.mobileHeaderWrap}>
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <Text style={styles.mobileTitle}>Painel</Text>
          <Text style={styles.mobileGreeting}>Olá, {firstName}</Text>
        </View>

        <Pressable
          {...(onNotificationPress ? ({ dataSet: { notificationsTrigger: 'true' } } as object) : {})}
          style={({ pressed }) => [
            styles.notificationButton,
            styles.notificationButtonMobile,
            pressed && styles.notificationButtonPressed,
          ]}
          onPress={handleNotificationPress}
          accessibilityRole="button"
          accessibilityLabel={notificationAccessibilityLabel}>
          <Image
            source={HEADER_BELL_ICON}
            style={styles.notificationIcon}
            contentFit="contain"
            tintColor={BrandColors.orange}
          />
          {badgeCount && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{badgeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      {competenceLabel ? (
        <CompetenceSwitcher
          label={competenceLabel}
          onPrevious={onPreviousCompetence}
          onNext={onNextCompetence}
          canAdvance={canAdvanceCompetence}
          notice={competenceNotice}
        />
      ) : null}
    </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.pageTitle}>Painel</Text>
        <Text style={styles.greeting}>Bom dia, {firstName}!</Text>
        <Text style={styles.subtitle}>Aqui está o resumo da sua equipe hoje.</Text>
        {competenceLabel ? (
          <CompetenceSwitcher
            label={competenceLabel}
            onPrevious={onPreviousCompetence}
            onNext={onNextCompetence}
            canAdvance={canAdvanceCompetence}
            notice={competenceNotice}
          />
        ) : null}
      </View>

      <View style={styles.headerRight}>
        <View style={styles.searchWrap}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder="Buscar funcionário..."
              placeholderTextColor={BrandColors.textMuted}
              style={styles.searchInput}
              value={employeeQuery}
              onChangeText={(value) => {
                onEmployeeQueryChange(value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => {
                setTimeout(() => setIsSearchOpen(false), 160);
              }}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              accessibilityLabel="Buscar funcionário"
            />
          </View>
          {isSearchOpen && employeeQuery.trim().length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.length === 0 ? (
                <Text style={styles.searchEmpty}>Nenhum funcionário encontrado.</Text>
              ) : (
                searchResults.map((employee) => (
                  <Pressable
                    key={employee.id}
                    style={({ pressed }) => [styles.searchResult, pressed && styles.searchResultPressed]}
                    onPress={() => openEmployee(employee.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir perfil de ${employee.name}`}>
                    <View style={[styles.searchAvatar, { backgroundColor: `${employee.avatarColor}18` }]}>
                      <Text style={[styles.searchAvatarText, { color: employee.avatarColor }]}>
                        {employee.initials}
                      </Text>
                    </View>
                    <View style={styles.searchResultCopy}>
                      <Text style={styles.searchResultName} numberOfLines={1}>
                        {employee.name}
                      </Text>
                      <Text style={styles.searchResultRole} numberOfLines={1}>
                        {employee.role}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        <Pressable
          {...(onNotificationPress ? ({ dataSet: { notificationsTrigger: 'true' } } as object) : {})}
          style={({ pressed }) => [
            styles.notificationButton,
            pressed && styles.notificationButtonPressed,
          ]}
          onPress={handleNotificationPress}
          accessibilityRole="button"
          accessibilityLabel={notificationAccessibilityLabel}>
          <Image
            source={HEADER_BELL_ICON}
            style={styles.notificationIcon}
            contentFit="contain"
            tintColor={BrandColors.orange}
          />
          {badgeCount && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{badgeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function CompetenceSwitcher({
  label,
  onPrevious,
  onNext,
  canAdvance,
  notice,
}: {
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
  canAdvance: boolean;
  notice?: string | null;
}) {
  return (
    <View style={styles.competenceBlock}>
      <View style={styles.competenceControl}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Competência anterior"
          onPress={onPrevious}
          style={({ pressed, hovered }) => [
            styles.competenceArrow,
            (pressed || hovered) && styles.competenceArrowActive,
          ]}>
          <Text style={styles.competenceArrowText}>‹</Text>
        </Pressable>
        <Text style={styles.competenceValue}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canAdvance ? 'Próxima competência' : 'Não há competência futura'}
          accessibilityState={{ disabled: !canAdvance }}
          disabled={!canAdvance}
          onPress={onNext}
          style={({ pressed, hovered }) => [
            styles.competenceArrow,
            !canAdvance && styles.competenceArrowDisabled,
            (pressed || hovered) && canAdvance && styles.competenceArrowActive,
          ]}>
          <Text style={[styles.competenceArrowText, !canAdvance && styles.competenceArrowTextDisabled]}>›</Text>
        </Pressable>
      </View>
      {notice ? <Text style={styles.competenceNotice}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mobileHeaderWrap: {
    paddingBottom: 12,
    gap: 8,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mobileHeaderLeft: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  mobileTitle: {
    fontSize: MobileType.pageTitle,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.3,
  },
  mobileGreeting: {
    fontSize: MobileType.bodySmall,
    color: BrandColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    gap: 24,
    flexWrap: 'wrap',
  },
  headerLeft: {
    gap: 4,
    flex: 1,
    minWidth: 240,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.3,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  competenceBlock: {
    marginTop: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  competenceControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: 6,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  competenceArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  competenceArrowActive: {
    backgroundColor: BrandColors.orangeLight,
  },
  competenceArrowDisabled: {
    opacity: 0.4,
  },
  competenceArrowText: {
    fontSize: 18,
    lineHeight: 20,
    color: BrandColors.textSecondary,
  },
  competenceArrowTextDisabled: {
    color: BrandColors.textMuted,
  },
  competenceValue: {
    minWidth: 132,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  competenceNotice: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textSecondary,
    maxWidth: 280,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexShrink: 0,
    zIndex: 30,
  },
  searchWrap: {
    position: 'relative',
    zIndex: 30,
    minWidth: 240,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    gap: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    minWidth: 240,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  searchIcon: {
    fontSize: 16,
    color: BrandColors.textMuted,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.textPrimary,
    outlineStyle: 'none' as 'solid',
    minWidth: 160,
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: BrandColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.border,
    overflow: 'hidden',
    zIndex: 40,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchResultPressed: {
    backgroundColor: BrandColors.offWhite,
  },
  searchAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchResultCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  searchResultRole: {
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  searchEmpty: {
    fontSize: 13,
    color: BrandColors.textMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
    position: 'relative',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  notificationButtonMobile: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  notificationButtonPressed: {
    opacity: 0.85,
  },
  notificationIcon: {
    width: 16,
    height: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.white,
  },
});
