import { useCallback, useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BrandColors, Shadows } from '@/constants/colors';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const HOVER_DURATION_MS = 200;
const DISMISS_THRESHOLD_RATIO = 0.35;
const DISMISS_ANIMATION_MS = 200;

const WEB_SHADOW_DEFAULT = '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)';
const WEB_SHADOW_HOVER = '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)';

type AnimatedNotificationCardProps = {
  children: ReactNode;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedNotificationCard({
  children,
  onDismiss,
  style,
}: AnimatedNotificationCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const translateX = useSharedValue(0);
  const cardWidth = useSharedValue(0);
  const hoverProgress = useSharedValue(0);
  const isDragging = useSharedValue(0);
  const reduceMotion = useSharedValue(0);

  useEffect(() => {
    reduceMotion.value = prefersReducedMotion ? 1 : 0;
  }, [prefersReducedMotion, reduceMotion]);

  const finishDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(14)
    .failOffsetY([-10, 10])
    .onBegin(() => {
      isDragging.value = 1;
    })
    .onUpdate((event) => {
      'worklet';
      if (reduceMotion.value === 1) return;

      const resistedTranslation = event.translationX < 0 ? event.translationX * 0.12 : event.translationX;
      translateX.value = Math.max(0, resistedTranslation);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = 0;

      const threshold = cardWidth.value * DISMISS_THRESHOLD_RATIO;
      const shouldDismiss = translateX.value >= threshold && cardWidth.value > 0;

      if (reduceMotion.value === 1) {
        if (shouldDismiss) {
          runOnJS(finishDismiss)();
          return;
        }
        translateX.value = 0;
        return;
      }

      if (shouldDismiss) {
        translateX.value = withTiming(cardWidth.value * 1.15, { duration: DISMISS_ANIMATION_MS }, (finished) => {
          if (finished) {
            runOnJS(finishDismiss)();
          }
        });
        return;
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
    })
    .onFinalize(() => {
      isDragging.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const dragProgress =
      cardWidth.value > 0 ? Math.min(translateX.value / (cardWidth.value * DISMISS_THRESHOLD_RATIO), 1) : 0;
    const opacity = 1 - dragProgress * 0.55;
    const scale = prefersReducedMotion ? 1 : 1 + hoverProgress.value * 0.02;

    if (Platform.OS === 'web') {
      const showHoverShadow = hoverProgress.value > 0 && isDragging.value === 0;
      return {
        transform: [{ translateX: translateX.value }, { scale }],
        opacity,
        boxShadow: showHoverShadow ? WEB_SHADOW_HOVER : WEB_SHADOW_DEFAULT,
        cursor: isDragging.value ? ('grabbing' as const) : ('grab' as const),
      };
    }

    return {
      transform: [{ translateX: translateX.value }, { scale }],
      opacity,
    };
  });

  const handleHoverIn = () => {
    if (prefersReducedMotion || Platform.OS !== 'web') return;
    hoverProgress.value = withTiming(1, { duration: HOVER_DURATION_MS });
  };

  const handleHoverOut = () => {
    if (prefersReducedMotion || Platform.OS !== 'web') return;
    hoverProgress.value = withTiming(0, { duration: HOVER_DURATION_MS });
  };

  const layoutTransition = prefersReducedMotion ? undefined : LinearTransition.duration(HOVER_DURATION_MS);

  return (
    <Animated.View layout={layoutTransition} style={styles.itemWrap}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.draggable, style, animatedStyle as StyleProp<ViewStyle>]}
          onLayout={(event) => {
            cardWidth.value = event.nativeEvent.layout.width;
          }}
          {...(Platform.OS === 'web'
            ? ({
                onMouseEnter: handleHoverIn,
                onMouseLeave: handleHoverOut,
              } as object)
            : {})}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  itemWrap: {
    width: '100%',
  },
  draggable: {
    width: '100%',
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : {}),
  },
});

export const panelNotificationCardStyle = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: BrandColors.textMuted,
    marginTop: 2,
  },
});
