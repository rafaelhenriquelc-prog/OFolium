import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import type { AppSymbolName } from '@/constants/icons';

type AppIconProps = {
  name: AppSymbolName;
  size: number;
  color: string;
};

export function AppIcon({ name, size, color }: AppIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SymbolView name={name} size={size} tintColor={color} weight="medium" resizeMode="scaleAspectFit" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
