import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';

type ToastTone = 'success' | 'error';

type ToastProps = {
  message: string | null;
  tone?: ToastTone;
  onHide: () => void;
};

export function Toast({ message, tone = 'success', onHide }: ToastProps) {
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => onHideRef.current(), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.host}>
      <View style={[styles.toast, tone === 'error' ? styles.toastError : styles.toastSuccess]}>
        <Text style={[styles.text, tone === 'error' ? styles.textError : styles.textSuccess]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    zIndex: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    maxWidth: 420,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BrandColors.white,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  toastSuccess: {
    borderWidth: 1,
    borderColor: 'rgba(34, 160, 107, 0.35)',
  },
  toastError: {
    borderWidth: 1,
    borderColor: 'rgba(229, 72, 77, 0.35)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  textSuccess: {
    color: BrandColors.green,
  },
  textError: {
    color: BrandColors.red,
  },
});
