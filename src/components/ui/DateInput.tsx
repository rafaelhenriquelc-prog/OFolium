import { ComponentProps } from 'react';

import { Input } from '@/components/ui/Input';
import { formatDateInput } from '@/utils/dateInput';

type DateInputProps = Omit<ComponentProps<typeof Input>, 'keyboardType' | 'maxLength' | 'onChangeText'> & {
  onChangeText?: (value: string) => void;
};

export function DateInput({ value, onChangeText, placeholder = 'DD/MM/AAAA', ...props }: DateInputProps) {
  const handleChange = (text: string) => {
    onChangeText?.(formatDateInput(text));
  };

  return (
    <Input
      {...props}
      value={value}
      placeholder={placeholder}
      keyboardType="numeric"
      maxLength={10}
      onChangeText={handleChange}
    />
  );
}
