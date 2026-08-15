import {
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ModalProps as RNModalProps,
} from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { MIN_TOUCH_TARGET } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type ModalProps = RNModalProps & {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function Modal({ title, onClose, children, wide, visible, ...props }: ModalProps) {
  const { isMobile, insets } = useResponsiveLayout();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose} {...props}>
      <Pressable
        style={[styles.overlay, isMobile && styles.overlayMobile]}
        onPress={onClose}>
        <Pressable
          style={[
            styles.content,
            wide && styles.contentWide,
            isMobile && styles.contentMobile,
            isMobile && { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            {isMobile && <View style={styles.mobileHandle} />}
            <Text style={[styles.title, isMobile && styles.titleMobile]}>{title}</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fechar">
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={isMobile ? styles.mobileScroll : undefined}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  overlayMobile: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  contentWide: {
    maxWidth: 640,
  },
  contentMobile: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxWidth: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mobileScroll: {
    flexGrow: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  mobileHandle: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BrandColors.border,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  titleMobile: {
    fontSize: 17,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.offWhite,
    flexShrink: 0,
  },
  closeIcon: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
});
