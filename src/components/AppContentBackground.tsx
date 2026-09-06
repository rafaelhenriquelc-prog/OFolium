import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/colors';

type AppContentBackgroundProps = {
  children: React.ReactNode;
};

export function AppContentBackground({ children }: AppContentBackgroundProps) {
  return (
    <View style={styles.shell}>
      <Image
        source={require('@/assets/images/fundo_geo2.png')}
        style={styles.backgroundImage}
        contentFit="cover"
        contentPosition="center"
      />
      <View pointerEvents="none" style={styles.backgroundOverlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: BrandColors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
    zIndex: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(244, 244, 246, 0.2)',
    zIndex: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
  },
});
