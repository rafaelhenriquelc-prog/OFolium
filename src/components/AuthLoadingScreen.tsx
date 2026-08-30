import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/colors';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={BrandColors.orange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.background,
    ...(Platform.OS === 'web' ? ({ minHeight: '100vh' as unknown as number }) : {}),
  },
});
