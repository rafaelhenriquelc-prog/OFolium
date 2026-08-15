import { ScrollView, StyleSheet, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';

import { mobilePageContain } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type ScreenProps = ScrollViewProps & {
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, contentContainerStyle, contentStyle, style, ...props }: ScreenProps) {
  const { contentPaddingHorizontal, contentPaddingBottom, isMobile, isCompactLayout } =
    useResponsiveLayout();

  return (
    <ScrollView
      style={[styles.scrollView, isCompactLayout && mobilePageContain, style]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompactLayout ? contentPaddingHorizontal : 32,
          paddingBottom: isCompactLayout ? contentPaddingBottom : 48,
          paddingTop: isCompactLayout ? (isMobile ? 12 : 16) : 32,
        },
        contentStyle,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...props}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
