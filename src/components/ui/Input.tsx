import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { MOBILE_BREAKPOINT } from '@/constants/layout';

type InputProps = TextInputProps & {
  label?: string;
  optional?: boolean;
  error?: string;
  /** Espaçamento compacto para telas de autenticação mobile. */
  compact?: boolean;
};

export function Input({ label, optional, error, compact, style, ...props }: InputProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const isCompact = isMobile && compact;

  return (
    <View style={[styles.wrapper, isCompact && styles.wrapperCompact]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optional}>(opcional)</Text>}
        </View>
      )}
      <TextInput
        placeholderTextColor={BrandColors.textMuted}
        style={[
          styles.input,
          isMobile && styles.inputMobile,
          isCompact && styles.inputAuthCompact,
          error && styles.inputError,
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, isCompact && styles.errorCompact]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  wrapperCompact: {
    gap: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  optional: {
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  input: {
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 14,
    color: BrandColors.textPrimary,
    outlineStyle: 'none' as 'solid',
    width: '100%',
    ...(Platform.OS === 'web' ? Shadows.cardWeb : {}),
  },
  inputMobile: {
    fontSize: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  inputAuthCompact: {
    minHeight: 48,
    height: 48,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: BrandColors.red,
  },
  error: {
    fontSize: 12,
    color: BrandColors.red,
  },
  errorCompact: {
    marginTop: -2,
  },
});
