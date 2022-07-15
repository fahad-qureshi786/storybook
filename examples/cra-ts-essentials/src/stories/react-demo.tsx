import React, { FC, HTMLAttributes } from 'react';

const styles = {
  border: '1px solid #eee',
  borderRadius: 3,
  backgroundColor: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 15,
  padding: '3px 10px',
  margin: 10,
};

type ButtonProps = Pick<HTMLAttributes<HTMLButtonElement>, 'onClick'>;
export const Button: FC<ButtonProps> = ({ children, onClick }) => (
  <button onClick={onClick} style={styles} type="button">
    {children}
  </button>
);

Button.displayName = 'Button';
Button.defaultProps = {
  onClick: () => {},
};

interface WelcomeProps {
  showApp: () => void;
}

export const Welcome: FC<WelcomeProps> = ({ showApp }) => (
  <button type="button" onClick={showApp}>
    Welcome
  </button>
);
Welcome.displayName = 'Welcome';
Welcome.defaultProps = {
  showApp: () => {},
};
