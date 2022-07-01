import React, { FC } from 'react';

import { CheckboxControl } from './Checkbox';
import { RadioControl } from './Radio';
import { SelectControl } from './Select';
import { ControlProps, OptionsSelection, OptionsConfig } from '../types';

const Controls: Record<string, FC> = {
  check: CheckboxControl,
  'inline-check': CheckboxControl,
  radio: RadioControl,
  'inline-radio': RadioControl,
  select: SelectControl,
  'multi-select': SelectControl,
};

export type OptionsProps = ControlProps<OptionsSelection> & OptionsConfig;
export const OptionsControl: FC<OptionsProps> = (props) => {
  const { type = 'select' } = props;
  const normalized = {
    ...props,
    isInline: type.includes('inline'),
    isMulti: type.includes('multi'),
  };

  const Control = Controls[type];
  if (Control) {
    return <Control {...normalized} />;
  }
  throw new Error(`Unknown options type: ${type}`);
};
