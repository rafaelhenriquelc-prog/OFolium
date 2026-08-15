import { useRouter, type Href } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { BrandColors, Shadows } from '@/constants/colors';
import { mobileStackedCard, MIN_TOUCH_TARGET, MobileSpace, MobileType } from '@/constants/layout';
import { useEmployees } from '@/contexts/EmployeesContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function EmployeeTable() {
  const router = useRouter();
  const { employees } = useEmployees();
  const { isMobile } = useResponsiveLayout();
  const preview = employees.slice(0, 4);

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      <View style={[styles.cardHeader, isMobile && styles.cardHeaderMobile]}>
        <Text style={[styles.cardTitle, isMobile && styles.cardTitleMobile]}>Funcionários</Text>
        <View style={[styles.cardActions, isMobile && styles.cardActionsMobile]}>
          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
            onPress={() => router.push('/employees' as Href)}
            accessibilityRole="button">
            <Text style={styles.linkText}>Ver todos</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addButton, isMobile && styles.addButtonMobile, pressed && styles.addButtonPressed]}
            onPress={() => router.push('/employees' as Href)}
            accessibilityRole="button">
            <Text style={styles.addButtonText}>{isMobile ? '+ Novo' : '+ Adicionar'}</Text>
          </Pressable>
        </View>
      </View>

      {isMobile ? (
        <View style={styles.mobileList}>
          {preview.map((employee) => (
            <Pressable
              key={employee.id}
              style={({ pressed }) => [styles.mobileCard, pressed && styles.pressed]}
              onPress={() => router.push(`/employees/${employee.id}` as Href)}
              accessibilityRole="button">
              <View style={styles.mobileCardTop}>
                <View style={styles.employeeCell}>
                  <View style={[styles.avatar, styles.avatarMobile, { backgroundColor: `${employee.avatarColor}18` }]}>
                    <Text style={[styles.avatarText, { color: employee.avatarColor }]}>
                      {employee.initials}
                    </Text>
                  </View>
                  <View style={styles.mobileInfo}>
                    <Text style={styles.employeeName} numberOfLines={1}>
                      {employee.name}
                    </Text>
                    <Text style={styles.cellText} numberOfLines={1}>
                      {employee.role}
                    </Text>
                  </View>
                </View>
                <Badge label={employee.status} variant={getStatusVariant(employee.status)} />
              </View>
              <Text style={styles.mobileAction}>Ver detalhes →</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, styles.colEmployee]}>Funcionário</Text>
            <Text style={[styles.columnHeader, styles.colRole]}>Cargo</Text>
            <Text style={[styles.columnHeader, styles.colStatus]}>Status</Text>
            <Text style={[styles.columnHeader, styles.colActions]}>Ações</Text>
          </View>

          {preview.map((employee, index) => (
            <View
              key={employee.id}
              style={[styles.tableRow, index < preview.length - 1 && styles.tableRowBorder]}>
              <Pressable
                style={styles.colEmployee}
                onPress={() => router.push(`/employees/${employee.id}` as Href)}>
                <View style={styles.employeeCell}>
                  <View style={[styles.avatar, { backgroundColor: `${employee.avatarColor}18` }]}>
                    <Text style={[styles.avatarText, { color: employee.avatarColor }]}>
                      {employee.initials}
                    </Text>
                  </View>
                  <Text style={styles.employeeName} numberOfLines={1}>
                    {employee.name}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.colRole}>
                <Text style={styles.cellText}>{employee.role}</Text>
              </View>
              <View style={styles.colStatus}>
                <Badge label={employee.status} variant={getStatusVariant(employee.status)} />
              </View>
              <View style={styles.colActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/employees/${employee.id}` as Href)}>
                  <Text style={styles.actionIcon}>→</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 3,
    minWidth: 520,
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: BrandColors.border,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardMobile: {
    ...mobileStackedCard,
    padding: MobileSpace.cardPadding + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  cardHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    flexShrink: 0,
  },
  cardTitleMobile: {
    fontSize: MobileType.sectionTitle,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  cardActionsMobile: {
    justifyContent: 'space-between',
    width: '100%',
  },
  linkButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: BrandColors.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  addButtonMobile: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  mobileList: {
    gap: 8,
  },
  mobileCard: {
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: BrandColors.offWhite,
  },
  mobileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mobileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mobileAction: {
    fontSize: MobileType.bodySmall,
    fontWeight: '600',
    color: BrandColors.orange,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  colEmployee: {
    flex: 2.2,
    minWidth: 180,
    flexShrink: 1,
  },
  colRole: {
    flex: 1.2,
    minWidth: 100,
    flexShrink: 0,
    paddingRight: 8,
  },
  colStatus: {
    flex: 1,
    minWidth: 88,
    flexShrink: 0,
  },
  colActions: {
    width: 48,
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  employeeCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarMobile: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  employeeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  cellText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
    color: BrandColors.orange,
    fontWeight: '600',
  },
});
