import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`mt-1 block w-full rounded-lg border border-ui-border px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mid ${className}`}
      {...props}
    />
  );
}
