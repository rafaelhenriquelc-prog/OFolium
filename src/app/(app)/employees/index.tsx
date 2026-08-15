import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/mobile/Screen';

import { PlanLimitModal } from '@/components/PlanLimitModal';
import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HorizontalTableScroll } from '@/components/ui/HorizontalTableScroll';
import { DateInput } from '@/components/ui/DateInput';
import { Input } from '@/components/ui/Input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandColors, Shadows } from '@/constants/colors';
import { useEmployees } from '@/contexts/EmployeesContext';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { Employee, EmployeeStatus } from '@/data/types';
import { isEmployeeActive } from '@/utils/employee';
import { formatCurrency } from '@/utils/format';

type Filter = 'Todos' | 'Ativos' | 'Inativos';

export default function EmployeesScreen() {
  const router = useRouter();
  const { employees, activeCount, addEmployee, isSubmitting } = useEmployees();
  const { activeLimit } = usePlan();
  const { isCompactLayout } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'Todos' ||
        (filter === 'Ativos' && isEmployeeActive(e.status)) ||
        (filter === 'Inativos' && !isEmployeeActive(e.status));
      return matchesSearch && matchesFilter;
    });
  }, [employees, search, filter]);

  const handleAddPress = () => {
    if (activeCount >= activeLimit) {
      setShowLimitModal(true);
      return;
    }
    setShowAddModal(true);
  };

  const handleExplorePro = () => {
    setShowLimitModal(false);
    router.push('/pro' as Href);
  };

  return (
    <Screen>
      <PageHeader
        title="Funcionários"
        subtitle="Gerencie sua equipe em um só lugar."
        action={
          <Button label="+ Adicionar funcionário" onPress={handleAddPress} />
        }
      />

      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Buscar funcionário..."
            placeholderTextColor={BrandColors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filters}>
          {(['Todos', 'Ativos', 'Inativos'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Card style={[styles.tableCard, isCompactLayout && styles.tableCardMobile]}>
        <HorizontalTableScroll minTableWidth={720}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, styles.colName]}>Nome</Text>
            <Text style={[styles.columnHeader, styles.colRole]}>Cargo</Text>
            <Text style={[styles.columnHeader, styles.colStatus]}>Status</Text>
            <Text style={[styles.columnHeader, styles.colSalary]}>Salário base</Text>
            <Text style={[styles.columnHeader, styles.colActions]}>Ações</Text>
          </View>

          {filtered.map((employee, index) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              isLast={index === filtered.length - 1}
            />
          ))}

          {filtered.length === 0 && (
            <Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>
          )}
        </HorizontalTableScroll>
      </Card>

      <AddEmployeeModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLimitReached={() => {
          setShowAddModal(false);
          setShowLimitModal(true);
        }}
        addEmployee={addEmployee}
        isSubmitting={isSubmitting}
      />
      <PlanLimitModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onExplorePro={handleExplorePro}
      />
    </Screen>
  );
}

function EmployeeRow({ employee, isLast }: { employee: Employee; isLast: boolean }) {
  const router = useRouter();

  return (
    <View style={[styles.tableRow, !isLast && styles.tableRowBorder]}>
      <Pressable
        style={[styles.colName, styles.nameCell]}
        onPress={() => router.push(`/employees/${employee.id}` as Href)}>
        <View style={[styles.avatar, { backgroundColor: `${employee.avatarColor}18` }]}>
          <Text style={[styles.avatarText, { color: employee.avatarColor }]}>
            {employee.initials}
          </Text>
        </View>
        <Text style={styles.employeeName}>{employee.name}</Text>
      </Pressable>
      <Text style={[styles.cellText, styles.colRole]}>{employee.role}</Text>
      <View style={styles.colStatus}>
        <Badge label={employee.status} variant={getStatusVariant(employee.status)} />
      </View>
      <Text style={[styles.cellText, styles.colSalary]}>{formatCurrency(employee.baseSalary)}</Text>
      <View style={[styles.colActions, styles.actionsCell]}>
        <Pressable
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${employee.name}`}
          onPress={() => router.push(`/employees/${employee.id}` as Href)}>
          <Text style={styles.actionIcon}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AddEmployeeModal({
  visible,
  onClose,
  onLimitReached,
  addEmployee,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onLimitReached: () => void;
  addEmployee: ReturnType<typeof useEmployees>['addEmployee'];
  isSubmitting: boolean;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('Ativo');
  const [hireDate, setHireDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const resetForm = () => {
    setName('');
    setRole('');
    setStatus('Ativo');
    setHireDate('');
    setBaseSalary('');
    setPhone('');
    setEmail('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const salaryDigits = baseSalary.replace(/\D/g, '');
    const parsedSalary = salaryDigits ? Number.parseInt(salaryDigits, 10) / 100 : 0;

    const result = addEmployee({
      name,
      role,
      status,
      baseSalary: parsedSalary,
      hireDate: hireDate || new Date().toISOString().slice(0, 10),
      phone: phone || undefined,
      email: email || undefined,
    });

    if (!result.success) {
      if (result.reason === 'limit_reached') {
        resetForm();
        onClose();
        onLimitReached();
      }
      return;
    }

    resetForm();
    onClose();
  };

  return (
    <Modal title="Adicionar funcionário" visible={visible} onClose={handleClose} wide>
      <View style={styles.form}>
        <Input label="Nome completo" placeholder="Nome do funcionário" value={name} onChangeText={setName} />
        <Input label="Cargo" placeholder="Ex: Atendente" value={role} onChangeText={setRole} />
        <MaskedInput
          label="Salário base"
          mask="currency"
          value={baseSalary}
          onChangeText={setBaseSalary}
        />
        <DateInput label="Data de admissão" value={hireDate} onChangeText={setHireDate} />
        <MaskedInput label="Telefone" optional mask="phone" value={phone} onChangeText={setPhone} />
        <Input label="E-mail" optional placeholder="email@exemplo.com" value={email} onChangeText={setEmail} />

        <View style={styles.statusField}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={styles.statusOptions}>
            {(['Ativo', 'Inativo'] as EmployeeStatus[]).map((s) => (
              <Pressable
                key={s}
                style={[styles.statusOption, status === s && styles.statusOptionActive]}
                onPress={() => setStatus(s)}>
                <Text
                  style={[
                    styles.statusOptionText,
                    status === s && styles.statusOptionTextActive,
                  ]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.modalActions}>
          <Button label="Cancelar" variant="outline" onPress={handleClose} />
          <View style={styles.modalPrimary}>
            <Button
              label={isSubmitting ? 'Salvando...' : 'Salvar funcionário'}
              fullWidth
              disabled={isSubmitting}
              onPress={handleSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 32, paddingBottom: 48 },
  toolbar: { gap: 16, marginBottom: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    gap: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    maxWidth: 360,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  searchIcon: { fontSize: 16, color: BrandColors.textMuted },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.textPrimary,
    outlineStyle: 'none' as 'solid',
  },
  filters: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  filterChipActive: {
    backgroundColor: BrandColors.orangeLight,
    borderColor: 'rgba(255, 92, 0, 0.25)',
  },
  filterText: { fontSize: 13, fontWeight: '500', color: BrandColors.textSecondary },
  filterTextActive: { color: BrandColors.orange, fontWeight: '600' },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableCardMobile: { overflow: 'visible' },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    backgroundColor: BrandColors.offWhite,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  colName: { flex: 2.2, minWidth: 180 },
  colRole: { flex: 1.2, minWidth: 100 },
  colStatus: { flex: 1, minWidth: 90 },
  colSalary: { flex: 1.2, minWidth: 110 },
  colActions: { flex: 0.5, minWidth: 60 },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700' },
  employeeName: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  cellText: { fontSize: 14, color: BrandColors.textSecondary },
  actionsCell: { flexDirection: 'row' },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 16, color: BrandColors.orange, fontWeight: '600' },
  emptyText: {
    padding: 32,
    textAlign: 'center',
    color: BrandColors.textMuted,
    fontSize: 14,
  },
  form: { gap: 14 },
  statusField: { gap: 8 },
  statusLabel: { fontSize: 13, fontWeight: '600', color: BrandColors.textPrimary },
  statusOptions: { flexDirection: 'row', gap: 8 },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
  },
  statusOptionActive: {
    backgroundColor: BrandColors.orangeLight,
    borderColor: 'rgba(255, 92, 0, 0.25)',
  },
  statusOptionText: { fontSize: 13, color: BrandColors.textSecondary, fontWeight: '500' },
  statusOptionTextActive: { color: BrandColors.orange, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalPrimary: { flex: 1 },
});
