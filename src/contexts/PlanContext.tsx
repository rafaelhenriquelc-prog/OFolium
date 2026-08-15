import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { getPlanConfig, PRO_TRIAL_DAYS, type PlanTier } from '@/constants/plans';

type PlanContextValue = {
  tier: PlanTier;
  planName: string;
  activeLimit: number;
  priceLabel: string;
  sidebarLinkLabel: string;
  isPro: boolean;
  trialEndsAt: Date | null;
  successMessage: string | null;
  activateTrial: () => void;
  clearSuccessMessage: () => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<PlanTier>('base');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const plan = getPlanConfig(tier);

  const activateTrial = useCallback(() => {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + PRO_TRIAL_DAYS);
    setTier('pro');
    setTrialEndsAt(endsAt);
    setSuccessMessage('Período de teste do OFolium Pro ativado com sucesso!');
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const value = useMemo<PlanContextValue>(
    () => ({
      tier,
      planName: plan.name,
      activeLimit: plan.activeEmployeeLimit,
      priceLabel: plan.priceLabel,
      sidebarLinkLabel: plan.sidebarLinkLabel,
      isPro: tier === 'pro',
      trialEndsAt,
      successMessage,
      activateTrial,
      clearSuccessMessage,
    }),
    [tier, plan, trialEndsAt, successMessage, activateTrial, clearSuccessMessage],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}
