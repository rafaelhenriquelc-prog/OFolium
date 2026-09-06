import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BrandColors } from '@/constants/colors';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import type { DashboardPendingItem } from '@/data/types';

type PendingDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PendingDetailsModal({ visible, onClose }: PendingDetailsModalProps) {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();
  const { isPro } = usePlan();
  const { dashboardPendingItems, dashboardStats, pendingDetailsPath } = useAppData();

  const hasDataMismatch = dashboardStats.pendingCount !== dashboardPendingItems.length;

  const viewState = useMemo(() => {
    if (isAuthLoading) return 'loading' as const;
    if (hasDataMismatch) return 'error' as const;
    if (dashboardPendingItems.length === 0) return 'empty' as const;
    return 'list' as const;
  }, [dashboardPendingItems.length, hasDataMismatch, isAuthLoading]);

  const handleOpenAll = () => {
    onClose();
    router.push(pendingDetailsPath as Href);
  };

  const handleItemAction = (item: DashboardPendingItem) => {
    onClose();
    router.push(item.actionPath as Href);
  };

  const title = isPro ? 'Pendências de revisão' : 'Pendências para conferir';

  return (
    <Modal title={title} visible={visible} onClose={onClose} wide>
      {viewState === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={BrandColors.orange} />
          <Text style={styles.stateText}>Carregando pendências…</Text>
        </View>
      )}

      {viewState === 'error' && (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateText}>
            As pendências não puderam ser exibidas no momento. Tente novamente em instantes.
          </Text>
          <View style={styles.stateActions}>
            <Button label="Fechar" variant="outline" onPress={onClose} />
          </View>
        </View>
      )}

      {viewState === 'empty' && (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Nenhuma pendência</Text>
          <Text style={styles.stateText}>
            {isPro
              ? 'Todos os fechamentos da competência atual já foram revisados.'
              : 'Não há notificações pendentes para conferir no momento.'}
          </Text>
          <View style={styles.stateActions}>
            <Button label="Fechar" fullWidth onPress={onClose} />
          </View>
        </View>
      )}

      {viewState === 'list' && (
        <>
          <Text style={styles.summary}>
            {dashboardPendingItems.length}{' '}
            {dashboardPendingItems.length === 1 ? 'pendência encontrada' : 'pendências encontradas'}
            {isPro ? ` · ${dashboardStats.competenceLabel}` : ''}
          </Text>

          <View style={styles.list}>
            {dashboardPendingItems.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemType}>{item.type}</Text>
                  <Text style={styles.itemDate}>{item.dateLabel}</Text>
                </View>
                {item.employeeName ? (
                  <Text style={styles.itemEmployee}>{item.employeeName}</Text>
                ) : null}
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.actionLabel}
                  onPress={() => handleItemAction(item)}
                  style={({ pressed, hovered }) => [
                    styles.itemAction,
                    (pressed || hovered) && styles.itemActionHovered,
                  ]}>
                  <Text style={styles.itemActionText}>{item.actionLabel}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.footerActions}>
            <Button
              label={isPro ? 'Ver fechamentos pendentes' : 'Ver notificações'}
              fullWidth
              onPress={handleOpenAll}
            />
          </View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    textAlign: 'center',
  },
  stateActions: {
    width: '100%',
    marginTop: 8,
  },
  summary: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  item: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    backgroundColor: BrandColors.offWhite,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  itemDate: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    flexShrink: 0,
  },
  itemEmployee: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.textSecondary,
  },
  itemAction: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  itemActionHovered: {
    opacity: 0.85,
  },
  itemActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.orange,
  },
  footerActions: {
    marginTop: 4,
  },
});
