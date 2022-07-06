import React, { FC, ComponentProps, HTMLAttributes } from 'react';

type Props = Pick<HTMLAttributes<HTMLButtonElement>, 'onClick'>;
const Button: FC<Props> = ({ children, onClick }) => (
  <button onClick={onClick} type="button">
    {children}
  </button>
);

type WrappedProps = {
  spacing: number;
} & ComponentProps<typeof Button>;

const WrappedButton: FC<WrappedProps> = ({ spacing, ...buttonProps }: WrappedProps) => (
  <div style={{ padding: spacing }}>
    <Button {...buttonProps} />
  </div>
);

export const component = WrappedButton;
