import React, { FC, ChangeEvent, useCallback, useState } from 'react';
import { styled } from '@storybook/theming';

import { Form } from '../form';
import { getControlId, getControlSetterButtonId } from './helpers';
import { ControlProps, TextValue, TextConfig } from './types';

export type TextProps = ControlProps<TextValue | undefined> & TextConfig;

const Wrapper = styled.label({
  display: 'flex',
});

const MaxLength = styled.div<{ isMaxed: boolean }>(({ isMaxed }) => ({
  marginLeft: '0.75rem',
  paddingTop: '0.35rem',
  color: isMaxed ? 'red' : undefined,
}));

const format = (value?: TextValue) => value || '';

export const TextControl: FC<TextProps> = ({
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  maxLength,
}) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const [forceVisible, setForceVisible] = useState(false);
  const onForceVisible = useCallback(() => {
    onChange('');
    setForceVisible(true);
  }, [setForceVisible]);
  if (value === undefined) {
    return (
      <Form.Button id={getControlSetterButtonId(name)} onClick={onForceVisible}>
        Set string
      </Form.Button>
    );
  }

  const isValid = typeof value === 'string';
  return (
    <Wrapper>
      <Form.Textarea
        id={getControlId(name)}
        maxLength={maxLength}
        onChange={handleChange}
        size="flex"
        placeholder="Edit string..."
        autoFocus={forceVisible}
        valid={isValid ? null : 'error'}
        {...{ name, value: isValid ? value : '', onFocus, onBlur }}
      />
      {maxLength && (
        <MaxLength isMaxed={value?.length === maxLength}>
          {value?.length ?? 0} / {maxLength}
        </MaxLength>
      )}
    </Wrapper>
  );
};
