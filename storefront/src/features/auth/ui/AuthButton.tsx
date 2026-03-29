import React from 'react';

export const AuthButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button {...props} className={`p-2 ${props.className || ''}`}>
      {children}
    </button>
  );
};


