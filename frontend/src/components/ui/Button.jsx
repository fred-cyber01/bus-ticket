import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg font-semibold px-4 py-2 transition';
  const variants = {
    primary: 'bg-gradient-to-r from-brand-mid to-brand-purple text-white shadow-sm hover:opacity-95',
    secondary: 'bg-white border border-ui-border text-slate-700 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:text-slate-900',
    success: 'bg-emerald-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  const cls = `${base} ${variants[variant] || variants.primary} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
