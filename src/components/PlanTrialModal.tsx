import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BrandColors } from '@/constants/colors';
import { PLANS, PRO_TRIAL_DAYS } from '@/constants/plans';

type PlanTrialModalProps = {
  visible: boolean;
  onClose: () => void;
  onActivate: () => void;
};

export function PlanTrialModal({ visible, onClose, onActivate }: PlanTrialModalProps) {
  return (
    <Modal title="Ativar período de teste?" visible={visible} onClose={onClose}>
      <Text style={styles.message}>
        Você terá acesso ao OFolium Pro por {PRO_TRIAL_DAYS} dias, incluindo até{' '}
        {PLANS.pro.activeEmployeeLimit} funcionários, fechamento completo, relatórios e exportações.
      </Text>
      <View style={styles.actions}>
        <Button label="Agora não" variant="outline" onPress={onClose} />
        <View style={styles.primaryAction}>
          <Button label="Ativar Pro grátis" fullWidth onPress={onActivate} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
  },
});
