import { useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandColors } from '@/constants/colors';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type HorizontalTableScrollProps = {
  children: React.ReactNode;
  minTableWidth?: number;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function HorizontalTableScroll({
  children,
  minTableWidth = 680,
  hint = 'Deslize para ver mais →',
  containerStyle,
}: HorizontalTableScrollProps) {
  const { isCompactLayout } = useResponsiveLayout();
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(minTableWidth);
  const [showHint, setShowHint] = useState(true);

  const canScroll = contentWidth > viewportWidth + 4;

  const handleLayout = (event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const hasMore = contentOffset.x + layoutMeasurement.width < contentSize.width - 4;
    setShowHint(hasMore);
  };

  if (!isCompactLayout) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <View style={[styles.wrapper, containerStyle]} onLayout={handleLayout}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(width) => setContentWidth(width)}
        style={[styles.scroll, Platform.OS === 'web' && styles.scrollWeb]}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.tableInner, { minWidth: minTableWidth }]}>{children}</View>
      </ScrollView>
      {canScroll && showHint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  scroll: {
    width: '100%',
  },
  scrollWeb: {
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-x pan-y',
  } as object,
  scrollContent: {
    flexGrow: 1,
  },
  tableInner: {
    width: '100%',
  },
  hint: {
    fontSize: 12,
    color: BrandColors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
});
