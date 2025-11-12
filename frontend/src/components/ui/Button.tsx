import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export default function Button({ children, variant = 'primary', ...rest }: Props) {
  const className = variant === 'primary' ? 'btn btn-primary' : 'btn';
  return (
    <button className={className} {...rest}>
      {children}
    </button>
  );
}
