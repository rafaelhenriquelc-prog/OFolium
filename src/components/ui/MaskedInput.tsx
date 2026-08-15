import { ComponentProps } from 'react';

import { Input } from '@/components/ui/Input';
import {
  applyNumericMask,
  numericMaskMaxLength,
  numericMaskPlaceholder,
  type NumericMask,
} from '@/utils/masks';

type MaskedInputProps = Omit<ComponentProps<typeof Input>, 'keyboardType' | 'maxLength' | 'onChangeText'> & {
  mask: NumericMask;
  onChangeText?: (value: string) => void;
};

export function MaskedInput({
  mask,
  value,
  onChangeText,
  placeholder,
  ...props
}: MaskedInputProps) {
  const handleChange = (text: string) => {
    onChangeText?.(applyNumericMask(text, mask));
  };

  return (
    <Input
      {...props}
      value={value}
      placeholder={placeholder ?? numericMaskPlaceholder[mask]}
      keyboardType="numeric"
      maxLength={numericMaskMaxLength[mask]}
      onChangeText={handleChange}
    />
  );
}
