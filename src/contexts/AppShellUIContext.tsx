import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

type AppShellUIContextValue = {
  consumeDashboardEntryAnimation: () => boolean;
  consumeSidebarToggleHint: () => boolean;
};

const AppShellUIContext = createContext<AppShellUIContextValue | null>(null);

export function AppShellUIProvider({ children }: { children: React.ReactNode }) {
  const hasPlayedDashboardEntryRef = useRef(false);
  const hasPlayedSidebarHintRef = useRef(false);

  const consumeDashboardEntryAnimation = useCallback(() => {
    if (hasPlayedDashboardEntryRef.current) {
      return false;
    }

    hasPlayedDashboardEntryRef.current = true;
    return true;
  }, []);

  const consumeSidebarToggleHint = useCallback(() => {
    if (hasPlayedSidebarHintRef.current) {
      return false;
    }

    hasPlayedSidebarHintRef.current = true;
    return true;
  }, []);

  const value = useMemo(
    () => ({
      consumeDashboardEntryAnimation,
      consumeSidebarToggleHint,
    }),
    [consumeDashboardEntryAnimation, consumeSidebarToggleHint],
  );

  return <AppShellUIContext.Provider value={value}>{children}</AppShellUIContext.Provider>;
}

export function useAppShellUI() {
  const context = useContext(AppShellUIContext);

  if (!context) {
    throw new Error('useAppShellUI must be used within AppShellUIProvider');
  }

  return context;
}
