import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg font-semibold transition';
  // Responsive padding defaults can be overridden by className
  const size = props.size === 'lg' ? 'px-6 py-3 text-base' : props.size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2';
  const variants = {
    primary: 'bg-gradient-to-r from-brand-mid to-brand-purple text-white shadow-sm hover:opacity-95',
    secondary: 'bg-white border border-ui-border text-slate-700 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:text-slate-900',
    success: 'bg-emerald-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  const cls = `${base} ${size} ${variants[variant] || variants.primary} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
