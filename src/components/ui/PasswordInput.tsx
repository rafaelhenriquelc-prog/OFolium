import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View, type TextInputProps } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { MIN_TOUCH_TARGET, MOBILE_BREAKPOINT } from '@/constants/layout';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  optional?: boolean;
  error?: string;
  /** Espaçamento compacto para telas de autenticação mobile. */
  compact?: boolean;
};

export function PasswordInput({
  label,
  optional,
  error,
  compact,
  style,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
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
      <View style={styles.field}>
        <TextInput
          placeholderTextColor={BrandColors.textMuted}
          secureTextEntry={!visible}
          style={[
            styles.input,
            isMobile && styles.inputMobile,
            isCompact && styles.inputAuthCompact,
            error && styles.inputError,
            style,
          ]}
          {...props}
        />
        <Pressable
          style={({ pressed }) => [styles.toggle, isMobile && styles.toggleMobile, pressed && styles.togglePressed]}
          onPress={() => setVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}>
          <Image
            source={
              visible
                ? require('@/assets/images/olho-1.png')
                : require('@/assets/images/olho-2.png')
            }
            style={styles.eyeIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
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
  field: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 48,
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
  toggle: {
    position: 'absolute',
    right: 4,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleMobile: {
    right: 2,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  togglePressed: {
    opacity: 0.85,
  },
  eyeIcon: {
    width: 18,
    height: 18,
  },
  error: {
    fontSize: 12,
    color: BrandColors.red,
  },
  errorCompact: {
    marginTop: -2,
  },
});
