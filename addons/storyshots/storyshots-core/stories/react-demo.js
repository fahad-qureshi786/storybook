import React from 'react';

const styles = {
  border: '1px solid #eee',
  borderRadius: 3,
  backgroundColor: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 15,
  padding: '3px 10px',
  margin: 10,
};

// eslint-disable-next-line react/prop-types
export const Button = ({ children, onClick }) => (
  <button onClick={onClick} style={styles} type="button">
    {children}
  </button>
);

Button.displayName = 'Button';
Button.defaultProps = {
  onClick: () => {},
};

// eslint-disable-next-line react/prop-types
export const Welcome = ({ showApp }) => (
  <button type="button" onClick={showApp}>
    Welcome
  </button>
);
Welcome.displayName = 'Welcome';
Welcome.defaultProps = {
  showApp: () => {},
};
