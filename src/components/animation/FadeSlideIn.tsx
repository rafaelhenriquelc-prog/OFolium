import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export const ENTRY_EASE_OUT = Easing.out(Easing.cubic);

type FadeSlideInProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
};

export function FadeSlideIn({
  children,
  delay = 0,
  duration = 400,
  translateY = 8,
  style,
  enabled = true,
}: FadeSlideInProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = enabled && !prefersReducedMotion;
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const offsetY = useSharedValue(shouldAnimate ? translateY : 0);

  useEffect(() => {
    if (!shouldAnimate) {
      opacity.value = 1;
      offsetY.value = 0;
      return;
    }

    opacity.value = withDelay(delay, withTiming(1, { duration, easing: ENTRY_EASE_OUT }));
    offsetY.value = withDelay(delay, withTiming(0, { duration, easing: ENTRY_EASE_OUT }));
  }, [delay, duration, offsetY, opacity, shouldAnimate, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offsetY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
