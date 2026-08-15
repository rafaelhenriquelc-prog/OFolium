import { useEffect, useId, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { BrandColors } from '@/constants/colors';
import { MIN_TOUCH_TARGET } from '@/constants/layout';

export type FilterSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type FilterSelectProps<T extends string = string> = {
  label: string;
  value: T;
  options: FilterSelectOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
  testID?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FilterSelect<T extends string = string>({
  label,
  value,
  options,
  onChange,
  compact,
  testID,
  open: openProp,
  onOpenChange,
}: FilterSelectProps<T>) {
  const listboxId = useId();
  const triggerRef = useRef<View>(null);
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [menuMaxHeight, setMenuMaxHeight] = useState(240);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = options[selectedIndex]?.label ?? value;

  const closeMenu = () => setOpen(false);

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  };

  const openMenu = () => {
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const root = triggerRef.current as unknown as HTMLElement | null;
      if (root?.contains?.(target)) return;
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: { nativeEvent: { key: string }; preventDefault: () => void }) => {
    const key = event.nativeEvent.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) {
        selectOption(highlightedIndex);
      } else {
        openMenu();
      }
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setHighlightedIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleMenuLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    if (Platform.OS !== 'web') return;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 640;
    const spaceBelow = viewportHeight - (y + height);
    setMenuMaxHeight(Math.max(120, Math.min(280, spaceBelow - 12)));
  };

  return (
    <View style={[styles.field, compact && styles.fieldCompact]} ref={triggerRef}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityState={{ expanded: open }}
        onPress={() => (open ? closeMenu() : openMenu())}
        {...(Platform.OS === 'web'
          ? ({
              onKeyDown: handleTriggerKeyDown,
            } as object)
          : {})}
        style={({ pressed, hovered }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          (pressed || hovered) && styles.triggerActive,
          open && styles.triggerOpen,
        ]}>
        <Text style={styles.triggerText} numberOfLines={compact ? 2 : 1}>
          {selectedLabel}
        </Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>▾</Text>
      </Pressable>

      {open && (
        <>
          {Platform.OS !== 'web' && (
            <Pressable style={styles.backdrop} onPress={closeMenu} accessibilityLabel="Fechar filtros" />
          )}
          <View style={[styles.menu, compact && styles.menuCompact, { maxHeight: menuMaxHeight }]} onLayout={handleMenuLayout}>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={styles.menuScroll}
              contentContainerStyle={styles.menuContent}>
              {options.map((option, index) => {
                const selected = option.value === value;
                const highlighted = index === highlightedIndex;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}
                    onPress={() => selectOption(index)}
                    onHoverIn={() => setHighlightedIndex(index)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      highlighted && styles.optionHighlighted,
                      pressed && styles.optionPressed,
                    ]}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {Platform.OS === 'web' && (
        <View nativeID={listboxId} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
    minWidth: 160,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    position: 'relative',
    zIndex: 1,
  },
  fieldCompact: {
    width: '100%',
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 180,
    gap: 8,
  },
  triggerCompact: {
    minWidth: 0,
    width: '100%',
  },
  triggerActive: {
    borderColor: BrandColors.orange,
  },
  triggerOpen: {
    borderColor: BrandColors.orange,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 3px rgba(255, 92, 0, 0.12)' } as object)
      : {}),
  },
  triggerText: {
    fontSize: 14,
    color: BrandColors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  chevron: {
    fontSize: 12,
    color: BrandColors.textMuted,
    flexShrink: 0,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  backdrop: {
    position: 'absolute',
    top: -400,
    bottom: -400,
    left: -400,
    right: -400,
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 20,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 10px 30px rgba(17, 17, 17, 0.12)' } as object) : {}),
  },
  menuCompact: {
    width: '100%',
  },
  menuScroll: {
    maxHeight: 280,
  },
  menuContent: {
    paddingVertical: 4,
  },
  option: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionSelected: {
    backgroundColor: BrandColors.orangeMuted,
  },
  optionHighlighted: {
    backgroundColor: BrandColors.orangeLight,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionText: {
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: BrandColors.orange,
  },
});
