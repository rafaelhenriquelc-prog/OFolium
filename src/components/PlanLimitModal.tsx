import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BrandColors } from '@/constants/colors';
import { PLANS } from '@/constants/plans';

type PlanLimitModalProps = {
  visible: boolean;
  onClose: () => void;
  onExplorePro: () => void;
};

export function PlanLimitModal({ visible, onClose, onExplorePro }: PlanLimitModalProps) {
  const baseLimit = PLANS.base.activeEmployeeLimit;

  return (
    <Modal title="Você atingiu o limite do plano Base" visible={visible} onClose={onClose}>
      <Text style={styles.message}>
        Seu plano permite até {baseLimit} funcionários ativos. Conheça o OFolium Pro para cadastrar
        até {PLANS.pro.activeEmployeeLimit} funcionários e acessar o fechamento mensal completo.
      </Text>
      <View style={styles.actions}>
        <Button label="Agora não" variant="outline" onPress={onClose} />
        <View style={styles.primaryAction}>
          <Button label="Conhecer Pro" fullWidth onPress={onExplorePro} />
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
